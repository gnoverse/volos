/**
 * Parses a string result from Gno in the format ("value" string)
 */
export function parseStringResult(result: string): string {
  const match = result.match(/\("([^"]+)"\s+string\)/)
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
 * Parses a string array result from Gno in the format ([]string) ["elem1" "elem2" "elem3"]
 */
export function parseStringArrayResult(result: string): string[] {
  // This handles parsing of a []string result from Gno
  // Example format: ([]string) [elem1 elem2 elem3]
  const match = result.match(/\(\[\]string\)\s+\[(.*)\]/)
  if (!match) {
    return []
  }
  
  if (!match[1] || match[1].trim() === '') {
    return []
  }
  
  // Split by spaces but respect quotes
  const elements: string[] = []
  const regex = /"([^"]*)"|\S+/g
  let m
  
  while ((m = regex.exec(match[1])) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    
    elements.push(m[1] || m[0])
  }
  
  return elements
}

/**
 * Parses a JSON result from Gno in the format ("json_string" string)
 * Handles escaped quotes in the JSON string
 */
export function parseJsonResult(result: string) {
  try {
    // Extract the JSON string from the Gno result format
    const match = result.match(/\("(.*?)"\s+string\)/)
    if (!match) {
      throw new Error('Invalid JSON result format')
    }
    
    // The JSON string is inside the quotes and may contain escaped quotes
    const jsonString = match[1].replace(/\\"/g, '"')
    return jsonString
  } catch (error) {
    console.error('Error parsing JSON result:', error, 'Raw result:', result)
    throw new Error(`Failed to parse JSON result: ${error}`)
  }
} 