// =====================================================
// Kobo Form Kit
// Shared guards for form builders. See KOBO_FORM_BUILDING_GUIDE.md.
//
// Kobo rejects a whole form for any of these, so a new builder should route
// its rows through the kit rather than reimplementing the checks:
//   - a select pointing at a choice list with no choices
//   - two questions sharing a name
//   - unbalanced brackets in an expression
//   - a partial write, when the sheet grid is smaller than the form
//
// The existing builders carry their own equivalents, prefixed per form
// (getMoHSAC…, getNewbornCTF…, getEmONCCTF2026…). New builders should use
// these instead; the older ones can migrate when they are next touched.
// =====================================================

/**
 * list_name values that ship with at least one usable choice.
 * choiceRows: [[list_name, name, label, ...], ...] without the header row.
 */
function koboKitCollectChoiceLists_(choiceRows) {
  var lists = {};

  for (var i = 0; i < choiceRows.length; i++) {
    var listName = String(choiceRows[i][0] == null ? "" : choiceRows[i][0]).trim();
    var name = String(choiceRows[i][1] == null ? "" : choiceRows[i][1]).trim();
    if (listName && name) lists[listName] = true;
  }

  return lists;
}

/** "select_one x" / "select_multiple x" → "x", anything else → "". */
function koboKitExtractSelectList_(type) {
  var match = String(type == null ? "" : type)
    .trim()
    .match(/^select_(?:one|multiple)\s+(\S+)/);
  return match ? match[1] : "";
}

/**
 * Drop every question whose choice list is empty and neutralise the references
 * left behind, so the remaining expressions stay valid XPath.
 *
 * rows: survey rows without the header
 * availableLists: from koboKitCollectChoiceLists_()
 * expressionColumns: indexes of relevant / choice_filter / calculation / …
 * label: form name, used in the log line
 */
function koboKitDropRowsWithMissingChoices_(
  rows, availableLists, expressionColumns, label
) {
  var droppedNames = [];
  var droppedLists = [];
  var dropped = {};
  var i;

  for (i = 0; i < rows.length; i++) {
    var listName = koboKitExtractSelectList_(rows[i][0]);
    if (!listName) continue;

    // Collapse stray whitespace so the type matches the trimmed choices.
    rows[i][0] = String(rows[i][0]).trim().replace(/\s+/g, " ");

    if (availableLists[listName]) continue;

    dropped[i] = true;
    droppedLists.push(listName);

    var fieldName = String(rows[i][1] == null ? "" : rows[i][1]).trim();
    if (fieldName) droppedNames.push(fieldName);
  }

  if (!droppedLists.length) return rows;

  var kept = [];
  for (i = 0; i < rows.length; i++) {
    if (dropped[i]) continue;
    kept.push(koboKitClearFieldReferences_(rows[i], droppedNames, expressionColumns));
  }

  Logger.log(
    (label || "Form") + ": removed " + droppedLists.length +
    " question(s) whose choice list is not in the generated choices sheet: " +
    droppedLists.sort().join(", ")
  );

  return kept;
}

/**
 * Replace ${name} with '' for every dropped question, so an expression that
 * referenced it stays valid and simply never matches.
 */
function koboKitClearFieldReferences_(row, droppedNames, expressionColumns) {
  if (!droppedNames.length) return row;

  for (var c = 0; c < expressionColumns.length; c++) {
    var column = expressionColumns[c];
    var value = row[column];
    if (!value) continue;

    var text = String(value);
    for (var n = 0; n < droppedNames.length; n++) {
      var reference = "${" + droppedNames[n] + "}";
      while (text.indexOf(reference) !== -1) {
        text = text.replace(reference, "''");
      }
    }
    row[column] = text;
  }

  return row;
}

/**
 * A partial write leaves a form Kobo cannot read, so grow the grid first.
 */
function koboKitEnsureSheetCapacity_(sheet, rowCount, columnCount) {
  var maxRows = sheet.getMaxRows();
  if (maxRows < rowCount) {
    sheet.insertRowsAfter(maxRows, rowCount - maxRows);
  }

  var maxColumns = sheet.getMaxColumns();
  if (maxColumns < columnCount) {
    sheet.insertColumnsAfter(maxColumns, columnCount - maxColumns);
  }
}

/**
 * Describe a malformed expression, or "" when it is well formed.
 * Parentheses inside quoted text are ignored, so "${x} = 'a)b'" is fine.
 */
function koboKitDescribeExpressionFault_(expression) {
  var depth = 0;
  var quote = "";

  for (var i = 0; i < expression.length; i++) {
    var ch = expression.charAt(i);

    if (quote) {
      if (ch === quote) quote = "";
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth < 0) return "Unmatched closing parenthesis";
    }
  }

  if (quote) return "Unterminated quote";
  if (depth > 0) return "Mismatched parentheses: " + depth + " unclosed";

  return "";
}

/**
 * Everything Kobo would reject in a set of survey rows, as readable lines.
 * Run this in a builder to fail early; the deployer runs the same checks
 * against the written tabs before uploading.
 *
 * Row numbers count the header, matching Kobo's "[row : N]".
 */
function koboKitFindSurveyProblems_(rows, availableLists, expressionColumns) {
  var problems = [];
  var seenNames = {};

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var type = String(row[0] == null ? "" : row[0]).trim();
    var name = String(row[1] == null ? "" : row[1]).trim();
    var rowNumber = i + 2;

    var listName = koboKitExtractSelectList_(type);
    if (listName && availableLists && !availableLists[listName]) {
      problems.push(
        "[row : " + rowNumber + "] List name not in choices sheet: " + listName
      );
    }

    if (name && type !== "end_group" && type !== "end_repeat") {
      if (seenNames[name]) {
        problems.push(
          "[row : " + rowNumber + "] Duplicate question name: " + name +
          " (first used on row " + seenNames[name] + ")"
        );
      } else {
        seenNames[name] = rowNumber;
      }
    }

    for (var c = 0; c < (expressionColumns || []).length; c++) {
      var expression = row[expressionColumns[c]];
      if (!expression) continue;

      var fault = koboKitDescribeExpressionFault_(String(expression));
      if (fault) {
        problems.push(
          "[row : " + rowNumber + "] " + fault + (name ? " for " + name : "")
        );
      }
    }
  }

  var depth = 0;
  for (var g = 0; g < rows.length; g++) {
    var groupType = String(rows[g][0] == null ? "" : rows[g][0]).trim();
    if (groupType === "begin_group" || groupType === "begin_repeat") depth++;
    else if (groupType === "end_group" || groupType === "end_repeat") depth--;
    if (depth < 0) {
      problems.push("[row : " + (g + 2) + "] Closes a group that is not open");
      depth = 0;
    }
  }
  if (depth > 0) {
    problems.push(depth + " group(s) never closed");
  }

  return problems;
}
