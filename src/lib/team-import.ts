const REQUIRED_HEADERS = ["teamcode", "teamname", "member1name", "member2name", "email"];
const MAX_CSV_LENGTH = 200_000;
const MAX_IMPORT_ROWS = 200;

export type ImportedTeamRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export function parseTeamCsv(input: string): ImportedTeamRow[] {
  if (input.length > MAX_CSV_LENGTH) throw new Error("CSV file exceeds the 200 KB limit.");

  const text = input.replace(/^\uFEFF/, "");
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (afterQuote && character !== "," && character !== "\n" && character !== "\r") {
      throw new Error("CSV contains text after a quoted field.");
    }
    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === '"') {
      throw new Error("CSV contains a quote in an unquoted field.");
    } else if (character === ",") {
      record.push(field);
      field = "";
      afterQuote = false;
    } else if (character === "\n" || character === "\r") {
      record.push(field);
      field = "";
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
      afterQuote = false;
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
    if (!quoted && character === '"') afterQuote = true;
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  record.push(field);
  if (record.some((value) => value.trim())) records.push(record);
  if (records.length < 2) throw new Error("CSV must contain a header and at least one team.");

  const headers = records[0]!.map((header) => header.trim().toLowerCase());
  const indexes = REQUIRED_HEADERS.map((header) => headers.indexOf(header));
  if (indexes.some((index) => index < 0) || new Set(indexes).size !== indexes.length) {
    throw new Error(`CSV must include these headers: ${REQUIRED_HEADERS.join(", ")}.`);
  }

  const data = records.slice(1);
  if (data.length > MAX_IMPORT_ROWS) {
    throw new Error(`A single import may contain at most ${MAX_IMPORT_ROWS} teams.`);
  }

  return data.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV record ${index + 2} has a different number of columns than the header.`);
    }
    return {
      rowNumber: index + 2,
      values: Object.fromEntries(
        REQUIRED_HEADERS.map((header, requiredIndex) => [
          header,
          values[indexes[requiredIndex]!]!.trim(),
        ]),
      ),
    };
  });
}
