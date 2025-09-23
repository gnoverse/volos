import { z } from "zod"

/**
 * Parses a string result from Gno in the format ("value" string)
 */
export function parseStringResult(result: string): string {
  const match = result.match(/\("([^"]*)"\s+string\)/)
  if (!match) {
    throw new Error('Invalid string result format')
  }
  return match[1]
}

/**
 * Parses a numeric result from Gno in formats like (123 int), (456 uint64), etc.
 * Supports all Go numeric types: int, uint, int8, uint8, int16, uint16, int32, uint32, int64, uint64, float32, float64
 */
export function parseNumberResult(result: string): number {
  const match = result.match(/\((-?\d+(?:\.\d+)?)\s+(?:int|uint|int8|uint8|int16|uint16|int32|uint32|int64|uint64|float32|float64)\)/)
  if (!match) {
    throw new Error('Invalid number result format')
  }
  return parseFloat(match[1])
}

/**
 * Parses a JSON result from Gno in the format ("json_string" string)
 * Handles escaped quotes in the JSON string
 */
export function parseJsonResult(result: string) {
  if (!result.startsWith('("') || !result.endsWith('" string)')) {
    throw new Error('Invalid string result format')
  }
  const jsonString = result.substring(2, result.length - 9).replace(/\\"/g, '"')
  return jsonString
}

/**
 * Parses a JSON result from Gno and returns the parsed object
 * @param result The raw Gno result string in format ("json_string" string)
 * @returns The parsed JavaScript object
 */
export function parseJsonResultObject<T>(result: string): T {
  const jsonString = parseJsonResult(result)
  return JSON.parse(jsonString) as T
}

/**
 * Parses a JSON result from Gno and validates it against a Zod schema
 * @param result The raw Gno result string in format ("json_string" string)
 * @param schema The Zod schema to validate against
 * @returns The parsed and validated JavaScript object
 */
export function parseValidatedJsonResult<T>(result: string, schema: z.ZodType<T>): T {
  const jsonString = parseJsonResult(result);
  return schema.parse(JSON.parse(jsonString));
}

/**
 * Parses an ABCI response from Gno in various Go primitive type formats
 * @param result The raw ABCI result string
 * @param expectedType The expected Go type (e.g., 'string', 'int64', 'int', 'int32', 'bool')
 * @returns The parsed value as string
 */
export function parseABCIResponse(result: string, expectedType: string = 'string'): string {
  let match: RegExpMatchArray | null = null;
  
  switch (expectedType) {
    case 'string':
      match = result.match(/\("([^"]*)"\s+string\)/)
      break;
    case 'int64':
    case 'int':
    case 'int32':
    case 'int8':
    case 'int16':
      match = result.match(/\((-?\d+)\s+(?:int64|int|int32|int8|int16)\)/)
      break;
    case 'uint64':
    case 'uint':
    case 'uint32':
    case 'uint8':
    case 'uint16':
      match = result.match(/\((\d+)\s+(?:uint64|uint|uint32|uint8|uint16)\)/)
      break;
    case 'bool':
      match = result.match(/\((\w+)\s+bool\)/)
      break;
    default:
      throw new Error(`Unsupported Go type: ${expectedType}`)
  }
  
  if (!match) {
    throw new Error(`Invalid ABCI response format for type ${expectedType}`)
  }
  
  return match[1]
}
