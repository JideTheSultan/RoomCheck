import {
  read,
  utils,
  type WorkSheet,
} from 'xlsx';

import type { TimetableDay } from '../../../types';
import { normalizeText } from '../../../utils/normalizeText';

type Matrix = string[][];

type HeaderMap = {
  classroom: number;
  courseCode: number;
  courseTitle: number | null;
  day: number;
  department: number;
  endTime: number | null;
  level: number;
  startTime: number | null;
  timeRange: number | null;
};

type SchedulePair = {
  courseColumn: number;
  day: TimetableDay;
  timeColumn: number;
};

type ScheduleBlock = {
  endColumn: number;
  headerRow: number;
  pairs: SchedulePair[];
  startColumn: number;
};

export type ParsedTimetableEntry = {
  classroomName: string;
  courseCode: string;
  courseTitle: string | null;
  dayOfWeek: TimetableDay;
  department: string;
  endMinutes: number;
  level: string;
  rawValue: string;
  sourceLocation: string;
  sourceSheet: string;
  startMinutes: number;
};

export type SpreadsheetTimetableParseResult = {
  entries: ParsedTimetableEntry[];
  warnings: string[];
};

const dayAliases: Record<string, TimetableDay> = {
  f: 5,
  fri: 5,
  friday: 5,
  m: 1,
  mon: 1,
  monday: 1,
  th: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  tu: 2,
  tue: 2,
  tues: 2,
  tuesday: 2,
  w: 3,
  wed: 3,
  wednesday: 3,
};

const headerAliases = {
  classroom: ['classroom', 'room', 'venue', 'location'],
  courseCode: ['course code', 'course', 'code'],
  courseTitle: ['course title', 'title', 'course name'],
  day: ['day', 'weekday'],
  department: ['department', 'dept', 'programme', 'program'],
  endTime: ['end time', 'end', 'to'],
  level: ['level', 'year'],
  startTime: ['start time', 'start', 'from'],
  timeRange: ['time', 'time range', 'time slot', 'period'],
} as const;

const courseCodePattern =
  /\b(?:PAU[-\s])?[A-Z]{2,}(?:[-\s][A-Z]{2,})*\s*-?\s*\d{3}\b/i;

function cellText(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function sheetToMatrix(sheet: WorkSheet): Matrix {
  const rows = utils.sheet_to_json<unknown[]>(sheet, {
    blankrows: true,
    defval: '',
    header: 1,
    raw: false,
  });

  return rows.map((row) => row.map(cellText));
}

function getCell(matrix: Matrix, row: number, column: number) {
  return matrix[row]?.[column]?.trim() ?? '';
}

function normalizeHeader(value: string) {
  return normalizeText(value)
    .replace(/[_/]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
}

function parseDay(value: string): TimetableDay | null {
  const normalized = normalizeHeader(value);

  return dayAliases[normalized] ?? null;
}

function parseClockToken(
  value: string,
  fallbackMeridiem: 'am' | 'pm' | null,
  otherHour: number,
  isStart: boolean,
) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);

  if (!match) {
    return null;
  }

  const hourText = match[1];
  const minuteText = match[2];

  if (!hourText) {
    return null;
  }

  const rawHour = Number(hourText);
  const minute = minuteText ? Number(minuteText) : 0;
  let meridiem = (match[3] as 'am' | 'pm' | undefined) ?? fallbackMeridiem;

  if (
    isStart &&
    !match[3] &&
    fallbackMeridiem === 'pm' &&
    otherHour === 12 &&
    rawHour !== 12
  ) {
    meridiem = 'am';
  }

  if (
    !Number.isInteger(rawHour) ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  if (!meridiem) {
    if (rawHour < 0 || rawHour > 23) {
      return null;
    }

    return rawHour * 60 + minute;
  }

  if (rawHour < 1 || rawHour > 12) {
    return null;
  }

  const hour =
    meridiem === 'am'
      ? rawHour === 12
        ? 0
        : rawHour
      : rawHour === 12
        ? 12
        : rawHour + 12;

  return hour * 60 + minute;
}

export function parseTimeRange(value: string) {
  const normalized = value
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = normalized.split('-').map((part) => part.trim());

  if (parts.length !== 2) {
    return null;
  }

  const startText = parts[0];
  const endText = parts[1];

  if (!startText || !endText) {
    return null;
  }

  const startMatch = startText.toLowerCase().match(/^(\d{1,2})/);
  const endMatch = endText.toLowerCase().match(/^(\d{1,2})/);
  const startMeridiemMatch = startText.toLowerCase().match(/(am|pm)\s*$/);
  const endMeridiemMatch = endText.toLowerCase().match(/(am|pm)\s*$/);

  if (!startMatch?.[1] || !endMatch?.[1]) {
    return null;
  }

  const startHour = Number(startMatch[1]);
  const endHour = Number(endMatch[1]);
  const startMeridiem =
    (startMeridiemMatch?.[1] as 'am' | 'pm' | undefined) ?? null;
  const endMeridiem =
    (endMeridiemMatch?.[1] as 'am' | 'pm' | undefined) ?? null;
  const startMinutes = parseClockToken(
    startText,
    startMeridiem ?? endMeridiem,
    endHour,
    true,
  );
  const endMinutes = parseClockToken(
    endText,
    endMeridiem ?? startMeridiem,
    startHour,
    false,
  );

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return null;
  }

  return {
    endMinutes,
    startMinutes,
  };
}

function normalizeLevel(value: string) {
  const normalized = value.trim().toLowerCase();
  const hundredLevel = normalized.match(/\b([1-6]00)\b/);

  if (hundredLevel?.[1]) {
    return hundredLevel[1];
  }

  const year = normalized.match(/\b(?:year\s*)?([1-6])\b/);

  if (year?.[1]) {
    return `${year[1]}00`;
  }

  return value.trim();
}

function parseGroupLabel(value: string) {
  const levelMatch = value.match(/\b([1-6]00)\s*(?:level)?\b/i);

  if (!levelMatch?.[1] || levelMatch.index === undefined) {
    return null;
  }

  const department = value
    .slice(0, levelMatch.index)
    .replace(/\bB\.?\s*SC\b/gi, '')
    .replace(/\bBACHELOR(?:\s+OF\s+SCIENCE)?\b/gi, '')
    .replace(/\bPROGRAMME\b/gi, '')
    .replace(/[-:|]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!department) {
    return null;
  }

  return {
    department,
    level: levelMatch[1],
  };
}

function normalizeCourseCode(value: string) {
  return value
    .toUpperCase()
    .replace(/\s*-\s*(?=\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCourseValue(value: string, defaultClassroom: string) {
  const codeMatch = value.match(courseCodePattern);

  if (!codeMatch?.[0] || codeMatch.index === undefined) {
    return null;
  }

  const courseCode = normalizeCourseCode(codeMatch[0]);
  const prefixRoom = value
    .slice(0, codeMatch.index)
    .replace(/\s*[-:|]+\s*$/g, '')
    .trim();
  const textAfterCode = value.slice(codeMatch.index + codeMatch[0].length);
  const parentheticalRoom = textAfterCode.match(/\(([^()]+)\)/)?.[1]?.trim();
  const classroomName =
    parentheticalRoom || prefixRoom || defaultClassroom.trim();

  if (!classroomName) {
    return null;
  }

  return {
    classroomName,
    courseCode,
  };
}

function isCourseTitleCandidate(value: string) {
  const normalized = normalizeHeader(value);

  if (
    !normalized ||
    /^\d+$/.test(normalized) ||
    parseDay(normalized) ||
    parseTimeRange(value) ||
    /\b(?:compulsory|elective|required|unit|status)\b/i.test(normalized)
  ) {
    return false;
  }

  return true;
}

function buildCourseCatalog(matrix: Matrix) {
  const catalog = new Map<string, string>();

  matrix.forEach((row) => {
    row.forEach((value, column) => {
      const parsedCourse = parseCourseValue(value, 'catalog');

      if (!parsedCourse || normalizeCourseCode(value) !== parsedCourse.courseCode) {
        return;
      }

      const title = row[column + 1]?.trim() ?? '';

      if (isCourseTitleCandidate(title)) {
        catalog.set(normalizeText(parsedCourse.courseCode), title);
      }
    });
  });

  return catalog;
}

function findHeaderColumn(row: string[], aliases: readonly string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);

  for (let column = 0; column < row.length; column += 1) {
    const value = normalizeHeader(row[column] ?? '');

    if (normalizedAliases.includes(value)) {
      return column;
    }
  }

  return null;
}

function findStandardHeader(row: string[]): HeaderMap | null {
  const classroom = findHeaderColumn(row, headerAliases.classroom);
  const courseCode = findHeaderColumn(row, headerAliases.courseCode);
  const courseTitle = findHeaderColumn(row, headerAliases.courseTitle);
  const day = findHeaderColumn(row, headerAliases.day);
  const department = findHeaderColumn(row, headerAliases.department);
  const endTime = findHeaderColumn(row, headerAliases.endTime);
  const level = findHeaderColumn(row, headerAliases.level);
  const startTime = findHeaderColumn(row, headerAliases.startTime);
  const timeRange = findHeaderColumn(row, headerAliases.timeRange);

  if (
    classroom === null ||
    courseCode === null ||
    day === null ||
    department === null ||
    level === null ||
    (timeRange === null && (startTime === null || endTime === null))
  ) {
    return null;
  }

  return {
    classroom,
    courseCode,
    courseTitle,
    day,
    department,
    endTime,
    level,
    startTime,
    timeRange,
  };
}

function parseStandardTable(
  matrix: Matrix,
  sourceSheet: string,
): ParsedTimetableEntry[] {
  const entries: ParsedTimetableEntry[] = [];

  for (let headerRow = 0; headerRow < matrix.length; headerRow += 1) {
    const row = matrix[headerRow];

    if (!row) {
      continue;
    }

    const header = findStandardHeader(row);

    if (!header) {
      continue;
    }

    for (
      let rowIndex = headerRow + 1;
      rowIndex < matrix.length;
      rowIndex += 1
    ) {
      const department = getCell(matrix, rowIndex, header.department);
      const level = normalizeLevel(getCell(matrix, rowIndex, header.level));
      const dayOfWeek = parseDay(getCell(matrix, rowIndex, header.day));
      const rawCourseValue = getCell(matrix, rowIndex, header.courseCode);
      const classroomName = getCell(matrix, rowIndex, header.classroom);

      if (!department && !level && !rawCourseValue && !classroomName) {
        break;
      }

      if (
        !department ||
        !level ||
        !dayOfWeek ||
        !rawCourseValue ||
        !classroomName
      ) {
        continue;
      }

      const timeValue =
        header.timeRange !== null
          ? getCell(matrix, rowIndex, header.timeRange)
          : `${getCell(matrix, rowIndex, header.startTime ?? -1)}-${getCell(
              matrix,
              rowIndex,
              header.endTime ?? -1,
            )}`;
      const timeRange = parseTimeRange(timeValue);
      const parsedCourse = parseCourseValue(
        rawCourseValue,
        classroomName,
      );

      if (!timeRange || !parsedCourse) {
        continue;
      }

      entries.push({
        classroomName: parsedCourse.classroomName,
        courseCode: parsedCourse.courseCode,
        courseTitle:
          header.courseTitle === null
            ? null
            : getCell(matrix, rowIndex, header.courseTitle) || null,
        dayOfWeek,
        department,
        endMinutes: timeRange.endMinutes,
        level,
        rawValue: rawCourseValue,
        sourceLocation: `Row ${rowIndex + 1}`,
        sourceSheet,
        startMinutes: timeRange.startMinutes,
      });
    }
  }

  return entries;
}

function findScheduleBlocks(matrix: Matrix): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];

  matrix.forEach((row, headerRow) => {
    const pairs: SchedulePair[] = [];

    for (let column = 0; column < row.length - 1; column += 1) {
      if (normalizeHeader(row[column] ?? '') !== 'time') {
        continue;
      }

      const day = parseDay(row[column + 1] ?? '');

      if (day) {
        pairs.push({
          courseColumn: column + 1,
          day,
          timeColumn: column,
        });
      }
    }

    let currentPairs: SchedulePair[] = [];

    pairs.forEach((pair) => {
      const previousPair = currentPairs[currentPairs.length - 1];

      if (
        previousPair &&
        pair.timeColumn - previousPair.timeColumn > 3
      ) {
        blocks.push({
          endColumn: previousPair.courseColumn,
          headerRow,
          pairs: currentPairs,
          startColumn: currentPairs[0]?.timeColumn ?? 0,
        });
        currentPairs = [];
      }

      currentPairs.push(pair);
    });

    const lastPair = currentPairs[currentPairs.length - 1];

    if (lastPair) {
      blocks.push({
        endColumn: lastPair.courseColumn,
        headerRow,
        pairs: currentPairs,
        startColumn: currentPairs[0]?.timeColumn ?? 0,
      });
    }
  });

  return blocks;
}

function findGroupForBlock(matrix: Matrix, block: ScheduleBlock) {
  let best:
    | {
        group: NonNullable<ReturnType<typeof parseGroupLabel>>;
        column: number;
        row: number;
        score: number;
      }
    | undefined;

  for (
    let row = Math.max(0, block.headerRow - 5);
    row <= block.headerRow;
    row += 1
  ) {
    for (
      let column = Math.max(0, block.startColumn - 3);
      column <= block.endColumn + 4;
      column += 1
    ) {
      const group = parseGroupLabel(getCell(matrix, row, column));

      if (!group) {
        continue;
      }

      const score =
        (block.headerRow - row) * 20 +
        Math.abs(column - block.startColumn);

      if (!best || score < best.score) {
        best = {
          column,
          group,
          row,
          score,
        };
      }
    }
  }

  return best
    ? {
        ...best.group,
        column: best.column,
        row: best.row,
      }
    : null;
}

function isRoomHeaderCandidate(value: string) {
  const normalized = normalizeHeader(value);

  if (
    !normalized ||
    /^\d+$/.test(normalized) ||
    parseDay(normalized) ||
    normalized === 'time' ||
    parseGroupLabel(value) ||
    courseCodePattern.test(value) ||
    /\b(?:courses?|unit|status|break|compulsory|elective|required)\b/i.test(
      normalized,
    )
  ) {
    return false;
  }

  return true;
}

function findRoomForBlock(
  matrix: Matrix,
  block: ScheduleBlock,
  groupRow: number,
) {
  let best: { room: string; score: number } | undefined;

  for (
    let row = Math.max(0, block.headerRow - 5);
    row < block.headerRow;
    row += 1
  ) {
    for (
      let column = Math.max(0, block.startColumn - 2);
      column <= block.endColumn + 2;
      column += 1
    ) {
      const value = getCell(matrix, row, column);

      if (!isRoomHeaderCandidate(value)) {
        continue;
      }

      const score =
        (block.headerRow - row) * 20 +
        Math.abs(column - block.startColumn) -
        (row === groupRow ? 100 : 0);

      if (!best || score < best.score) {
        best = { room: value, score };
      }
    }
  }

  return best?.room ?? null;
}

function findBlockEndRow(blocks: ScheduleBlock[], block: ScheduleBlock) {
  const nextOverlappingBlock = blocks
    .filter(
      (candidate) =>
        candidate.headerRow > block.headerRow &&
        candidate.startColumn <= block.endColumn &&
        candidate.endColumn >= block.startColumn,
    )
    .sort((left, right) => left.headerRow - right.headerRow)[0];

  return Math.min(
    nextOverlappingBlock?.headerRow ?? block.headerRow + 18,
    block.headerRow + 18,
  );
}

function parseVisualTables(
  matrix: Matrix,
  sourceSheet: string,
): ParsedTimetableEntry[] {
  const entries: ParsedTimetableEntry[] = [];
  const blocks = findScheduleBlocks(matrix);
  const courseCatalog = buildCourseCatalog(matrix);

  blocks.forEach((block) => {
    const group = findGroupForBlock(matrix, block);
    const defaultClassroom = group
      ? findRoomForBlock(matrix, block, group.row)
      : null;

    if (!group || !defaultClassroom) {
      return;
    }

    const endRow = Math.min(matrix.length, findBlockEndRow(blocks, block));

    for (
      let rowIndex = block.headerRow + 1;
      rowIndex < endRow;
      rowIndex += 1
    ) {
      block.pairs.forEach((pair) => {
        const timeRange = parseTimeRange(
          getCell(matrix, rowIndex, pair.timeColumn),
        );
        const rawValue = getCell(matrix, rowIndex, pair.courseColumn);

        if (
          !timeRange ||
          !rawValue ||
          /\bbreak\b/i.test(rawValue)
        ) {
          return;
        }

        const parsedCourse = parseCourseValue(rawValue, defaultClassroom);

        if (!parsedCourse) {
          return;
        }

        entries.push({
          classroomName: parsedCourse.classroomName,
          courseCode: parsedCourse.courseCode,
          courseTitle:
            courseCatalog.get(normalizeText(parsedCourse.courseCode)) ?? null,
          dayOfWeek: pair.day,
          department: group.department,
          endMinutes: timeRange.endMinutes,
          level: group.level,
          rawValue,
          sourceLocation: utils.encode_cell({
            c: pair.courseColumn,
            r: rowIndex,
          }),
          sourceSheet,
          startMinutes: timeRange.startMinutes,
        });
      });
    }
  });

  return entries;
}

function removeDuplicateEntries(entries: ParsedTimetableEntry[]) {
  const uniqueEntries = new Map<string, ParsedTimetableEntry>();

  entries.forEach((entry) => {
    const key = [
      normalizeText(entry.sourceSheet),
      normalizeText(entry.department),
      normalizeText(entry.level),
      entry.dayOfWeek,
      entry.startMinutes,
      entry.endMinutes,
      normalizeText(entry.courseCode),
      normalizeText(entry.classroomName),
    ].join('|');

    if (!uniqueEntries.has(key)) {
      uniqueEntries.set(key, entry);
    }
  });

  return [...uniqueEntries.values()];
}

export function parseSpreadsheetTimetable(
  data: ArrayBuffer | Uint8Array,
): SpreadsheetTimetableParseResult {
  const workbook = read(data, {
    cellDates: false,
    type: 'array',
  });
  const entries: ParsedTimetableEntry[] = [];
  const warnings: string[] = [];

  workbook.SheetNames.forEach((sourceSheet) => {
    const sheet = workbook.Sheets[sourceSheet];

    if (!sheet) {
      return;
    }

    const matrix = sheetToMatrix(sheet);
    const standardEntries = parseStandardTable(matrix, sourceSheet);
    const visualEntries = parseVisualTables(matrix, sourceSheet);
    const sheetEntries = removeDuplicateEntries([
      ...standardEntries,
      ...visualEntries,
    ]);

    if (sheetEntries.length === 0) {
      warnings.push(`${sourceSheet}: no timetable rows were recognised.`);
    } else {
      entries.push(...sheetEntries);
    }
  });

  return {
    entries: removeDuplicateEntries(entries),
    warnings,
  };
}
