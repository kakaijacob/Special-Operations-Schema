// =====================================================
// Kobo Question Bank
// Knowledge assessment questions, edited in a spreadsheet instead of in code.
//
// Knowledge tests are rewritten every year. Previously each question lived in
// three places that had to agree: the survey row, the choices block, and the
// score formula with its item count. This file reads one sheet and generates
// all three, so the score can never disagree with the questions.
//
// Create the sheet with createKoboQuestionBankTemplate("EmONC Question Bank"),
// then edit it. While the sheet is missing or empty the form keeps using the
// questions written in its builder, so adding this file changes nothing until
// you fill the sheet in.
//
// Sheet layout (header row exactly as below; Option E–H optional):
//   Question ID | Question | Type | Option A | Option B | Option C |
//   Option D | Correct | Required | Hint
//
//   Question ID  stable name for the field. Keep it unchanged year to year to
//                keep the data comparable; change it and it becomes a new
//                column in your exports.
//   Type         select_one (default), select_multiple, text, integer, decimal
//   Correct      the letter(s) of the right option: "B", or "B,D" for
//                select_multiple. Leave blank for an unscored question.
//   Required     true (default) or false
// =====================================================

var KOBO_QUESTION_BANK_OPTION_LETTERS =
  ["A", "B", "C", "D", "E", "F", "G", "H"];

var KOBO_QUESTION_BANK_HEADERS = [
  "Question ID",
  "Question",
  "Type",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct",
  "Required",
  "Hint"
];

/**
 * Create an empty question bank sheet, with the headers and one worked
 * example. Safe to run again: an existing sheet is left alone.
 */
function createKoboQuestionBankTemplate(sheetName) {
  var name = sheetName || "Question Bank";
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (ss.getSheetByName(name)) {
    Logger.log("'" + name + "' already exists — leaving it as it is.");
    return ss.getSheetByName(name);
  }

  var sheet = ss.insertSheet(name);
  var example = [
    "amtsl_uterotonic_drug",
    "1. Which uterotonic is recommended during AMTSL?",
    "select_one",
    "IM Carboprost 0.25 mg",
    "Oxytocin 10 IU IM",
    "Misoprostol 60 mcg per oral",
    "Carbetocin 50 mcg IM/IV",
    "B",
    "true",
    ""
  ];

  sheet.getRange(1, 1, 2, KOBO_QUESTION_BANK_HEADERS.length)
    .setValues([KOBO_QUESTION_BANK_HEADERS, example]);
  sheet.setFrozenRows(1);

  Logger.log("Created '" + name + "'. Replace the example row with this year's questions.");
  return sheet;
}

/**
 * Read a question bank sheet into records, or return [] when the sheet is
 * absent or holds nothing but its header.
 *
 * Throws when a row is unusable, naming the row, because a silently skipped
 * question is a question nobody gets asked.
 */
function readKoboQuestionBank_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var header = data[0];
  var idIndex = findKoboQuestionBankColumn_(header, "question id");
  var textIndex = findKoboQuestionBankColumn_(header, "question");
  var typeIndex = findKoboQuestionBankColumn_(header, "type");
  var correctIndex = findKoboQuestionBankColumn_(header, "correct");
  var requiredIndex = findKoboQuestionBankColumn_(header, "required");
  var hintIndex = findKoboQuestionBankColumn_(header, "hint");

  if (textIndex === -1) {
    throw new Error("'" + sheetName + "' needs a 'Question' column.");
  }

  var optionIndexes = [];
  for (var o = 0; o < KOBO_QUESTION_BANK_OPTION_LETTERS.length; o++) {
    var letter = KOBO_QUESTION_BANK_OPTION_LETTERS[o];
    var index = findKoboQuestionBankColumn_(header, "option " + letter.toLowerCase());
    if (index !== -1) optionIndexes.push({ letter: letter, index: index });
  }

  var questions = [];
  var seenNames = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var text = String(row[textIndex] == null ? "" : row[textIndex]).trim();
    if (!text) continue;

    var rowNumber = i + 1;
    var type = String(
      typeIndex === -1 ? "" : (row[typeIndex] == null ? "" : row[typeIndex])
    ).trim().toLowerCase() || "select_one";

    var name = cleanKoboFieldName_(
      idIndex === -1 ? "" : String(row[idIndex] == null ? "" : row[idIndex])
    );
    if (!name) name = "q" + rowNumber;

    if (seenNames[name]) {
      throw new Error(
        "'" + sheetName + "' row " + rowNumber + ": Question ID '" + name +
        "' is already used on row " + seenNames[name] + ". IDs must be unique."
      );
    }
    seenNames[name] = rowNumber;

    var options = [];
    for (var p = 0; p < optionIndexes.length; p++) {
      var label = String(
        row[optionIndexes[p].index] == null ? "" : row[optionIndexes[p].index]
      ).trim();
      if (label) options.push({ letter: optionIndexes[p].letter, label: label });
    }

    var isSelect = type.indexOf("select_") === 0;
    if (isSelect && options.length < 2) {
      throw new Error(
        "'" + sheetName + "' row " + rowNumber + " (" + name + ") is a " +
        type + " but has " + options.length + " option(s). Give it at least two."
      );
    }

    var correctLetters = parseKoboCorrectLetters_(
      correctIndex === -1 ? "" : row[correctIndex]
    );

    for (var c = 0; c < correctLetters.length; c++) {
      if (!koboQuestionHasLetter_(options, correctLetters[c])) {
        throw new Error(
          "'" + sheetName + "' row " + rowNumber + " (" + name + ") marks '" +
          correctLetters[c] + "' correct, but has no Option " + correctLetters[c] + "."
        );
      }
    }
    if (isSelect && !correctLetters.length) {
      Logger.log(
        "Question bank: " + name + " (row " + rowNumber +
        ") has no Correct answer and will not be scored."
      );
    }
    if (type === "select_one" && correctLetters.length > 1) {
      throw new Error(
        "'" + sheetName + "' row " + rowNumber + " (" + name + ") is a " +
        "select_one with " + correctLetters.length + " correct answers. Use " +
        "select_multiple, or mark one answer."
      );
    }

    var requiredRaw = requiredIndex === -1 ? "" :
      String(row[requiredIndex] == null ? "" : row[requiredIndex]).trim().toLowerCase();

    questions.push({
      name: name,
      label: text,
      type: type,
      options: options,
      correctLetters: correctLetters,
      isScored: correctLetters.length > 0,
      required: requiredRaw === "false" ? "false" : "true",
      hint: hintIndex === -1 ? "" :
        String(row[hintIndex] == null ? "" : row[hintIndex]).trim(),
      row: rowNumber
    });
  }

  return questions;
}

/**
 * Tidy a Question ID into an XLSForm field name.
 *
 * Unlike cleanForKobo(), which is for building variable names out of place
 * names, this keeps underscores and the author's capitalisation, so an ID
 * typed as "amtsl_uterotonic_drug" stays exactly that and last year's column
 * still matches this year's.
 */
function cleanKoboFieldName_(text) {
  var name = String(text == null ? "" : text)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  // An XML element name cannot start with a digit.
  if (/^[0-9]/.test(name)) name = "q_" + name;

  return name;
}

function findKoboQuestionBankColumn_(header, wanted) {
  for (var i = 0; i < header.length; i++) {
    if (String(header[i] == null ? "" : header[i]).trim().toLowerCase() === wanted) {
      return i;
    }
  }
  return -1;
}

/** "B" or "b, d" → ["B"], ["B","D"]. */
function parseKoboCorrectLetters_(value) {
  var raw = String(value == null ? "" : value).trim().toUpperCase();
  if (!raw) return [];

  var parts = raw.split(/[,\s/]+/);
  var letters = [];

  for (var i = 0; i < parts.length; i++) {
    var letter = parts[i].replace(/[^A-H]/g, "");
    if (letter && letters.indexOf(letter) === -1) letters.push(letter);
  }

  return letters;
}

function koboQuestionHasLetter_(options, letter) {
  for (var i = 0; i < options.length; i++) {
    if (options[i].letter === letter) return true;
  }
  return false;
}

/**
 * Survey rows for the question bank, laid out for the calling form.
 *
 * layout: { columns: [...header names...], relevant: "…" }
 * Values are placed by column name, so a form can carry any column order.
 */
function buildKoboQuestionSurveyRows_(questions, layout) {
  var columns = layout.columns;
  var rows = [];

  for (var i = 0; i < questions.length; i++) {
    var question = questions[i];
    var type = question.type;
    if (type.indexOf("select_") === 0) type = type + " " + question.name;

    rows.push(buildKoboQuestionRow_(columns, {
      type: type,
      name: question.name,
      label: question.label,
      hint: question.hint,
      required: question.required,
      relevant: layout.relevant || ""
    }));
  }

  return rows;
}

function buildKoboQuestionRow_(columns, values) {
  var row = [];
  for (var i = 0; i < columns.length; i++) {
    var key = String(columns[i]).trim().toLowerCase();
    row.push(values[key] === undefined ? "" : values[key]);
  }
  return row;
}

/**
 * Choice rows for the question bank: [list_name, name, label].
 *
 * A question with a single right answer stores it as "Correct", matching what
 * the assessments already collect so this year's exports line up with last
 * year's. A question with several right answers stores option letters
 * instead — two options both named "Correct" would be one duplicated choice.
 */
function buildKoboQuestionChoiceRows_(questions) {
  var rows = [];

  for (var i = 0; i < questions.length; i++) {
    var question = questions[i];
    if (question.type.indexOf("select_") !== 0) continue;

    for (var o = 0; o < question.options.length; o++) {
      var option = question.options[o];
      rows.push([
        question.name,
        koboQuestionChoiceName_(question, option.letter),
        option.letter + ". " + option.label
      ]);
    }
  }

  return rows;
}

/** Stored value for one option. */
function koboQuestionChoiceName_(question, letter) {
  var isCorrect = question.correctLetters.indexOf(letter) !== -1;
  if (isCorrect && question.correctLetters.length === 1) return "Correct";
  return letter;
}

/**
 * Score as a percentage of the scored questions, rounded to `decimals`.
 * Built from the same records as the questions, so the divisor always matches
 * the number of questions actually asked.
 */
function buildKoboQuestionScoreCalc_(questions, decimals) {
  var terms = [];

  for (var i = 0; i < questions.length; i++) {
    var question = questions[i];
    if (!question.isScored) continue;

    if (question.type === "select_multiple") {
      // Every right option ticked and nothing else.
      var parts = [];
      for (var c = 0; c < question.correctLetters.length; c++) {
        parts.push(
          "selected(${" + question.name + "}, '" +
          koboQuestionChoiceName_(question, question.correctLetters[c]) + "')"
        );
      }
      parts.push(
        "count-selected(${" + question.name + "}) = " +
        question.correctLetters.length
      );
      terms.push("(" + parts.join(" and ") + ")");
    } else {
      terms.push("(${" + question.name + "}='Correct')");
    }
  }

  if (!terms.length) return "";

  var places = decimals === undefined ? 0 : decimals;
  return "round((" + terms.join("+") + ")*100 div " + terms.length + "," + places + ")";
}

/** How many questions carry a correct answer. */
function countKoboScoredQuestions_(questions) {
  var total = 0;
  for (var i = 0; i < questions.length; i++) {
    if (questions[i].isScored) total++;
  }
  return total;
}
