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
  try {
    if (!result.startsWith('("') || !result.endsWith('" string)')) {
      throw new Error('Invalid string result format')
    }
    
    const jsonString = result.substring(2, result.length - 9).replace(/\\"/g, '"')
    return jsonString
  } catch (error) {
    console.error('Error parsing JSON result:', error, 'Raw result:', result)
    throw new Error(`Failed to parse JSON result: ${error}`)
  }
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
  try {
    return schema.parse(JSON.parse(jsonString));
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', (error as Error).message);
    } else {
      console.error('JSON parsing error:', error);
    }
    throw new Error(`Failed to validate JSON result: ${error}`);
  }
}