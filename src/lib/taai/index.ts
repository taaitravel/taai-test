/**
 * TAAI Configuration Module
 * Central export for all TAAI AI configuration
 */

export { TAAI_SYSTEM_PROMPT, getSystemPromptWithContext } from './system-prompt';
export { 
  ALL_TOOLS, 
  READ_TOOLS, 
  SEARCH_TOOLS, 
  WRITE_TOOLS,
  getToolsForAI,
  getLegacyFunctionFormat,
  type ToolDefinition 
} from './tool-definitions';
export { TAAI_BRAND, getTAAIIntroduction, getTAAIValueProposition } from './brand-identity';
