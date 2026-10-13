// ==============================================================================
// Zuu Agent — Typed Server-Side Conditional Engine & Safe Transformer
// Recreates n8n If node & Code node in safe, strongly-typed TypeScript.
// Strictly avoids eval() and new Function() to eliminate RCE vulnerabilities.
// ==============================================================================

export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'regex_match' 
  | 'length_greater_than' 
  | 'length_less_than' 
  | 'greater_than'
  | 'less_than'
  | 'is_not_empty'
  | 'sentiment_positive';

export interface ConditionalRule {
  field: string;
  operator: ConditionOperator;
  value?: string | number | boolean;
}

export interface ConditionalEvaluationResult {
  passed: boolean;
  eligibleForPublication: boolean;
  failedRules: string[];
  appliedTransforms: string[];
}

export class ConditionalEngine {
  /**
   * Safely evaluates conditional rules without eval()
   */
  public static evaluateRules(
    context: Record<string, any>,
    rules: ConditionalRule[] = []
  ): ConditionalEvaluationResult {
    if (!rules || rules.length === 0) {
      return {
        passed: true,
        eligibleForPublication: true,
        failedRules: [],
        appliedTransforms: []
      };
    }

    const failedRules: string[] = [];

    for (const rule of rules) {
      const fieldValue = String(context[rule.field] ?? '');
      const targetValue = rule.value !== undefined ? String(rule.value) : '';

      let matched = false;

      switch (rule.operator) {
        case 'equals':
          matched = fieldValue === targetValue;
          break;
        case 'not_equals':
          matched = fieldValue !== targetValue;
          break;
        case 'contains':
          matched = fieldValue.toLowerCase().includes(targetValue.toLowerCase());
          break;
        case 'not_contains':
          matched = !fieldValue.toLowerCase().includes(targetValue.toLowerCase());
          break;
        case 'starts_with':
          matched = fieldValue.startsWith(targetValue);
          break;
        case 'ends_with':
          matched = fieldValue.endsWith(targetValue);
          break;
        case 'is_not_empty':
          matched = fieldValue.trim().length > 0;
          break;
        case 'length_greater_than':
          matched = fieldValue.length > Number(targetValue || 0);
          break;
        case 'length_less_than':
          matched = fieldValue.length < Number(targetValue || 0);
          break;
        case 'greater_than':
          matched = Number(context[rule.field] ?? 0) > Number(targetValue || 0);
          break;
        case 'less_than':
          matched = Number(context[rule.field] ?? 0) < Number(targetValue || 0);
          break;
        case 'regex_match':
          try {
            const re = new RegExp(targetValue, 'i');
            matched = re.test(fieldValue);
          } catch {
            matched = false;
          }
          break;
        default:
          matched = true;
          break;
      }

      if (!matched) {
        failedRules.push(`${rule.field} failed [${rule.operator} ${targetValue}]`);
      }
    }

    const passed = failedRules.length === 0;

    return {
      passed,
      eligibleForPublication: passed,
      failedRules,
      appliedTransforms: []
    };
  }

  /**
   * Safe data transformation replacing n8n JavaScript Code node.
   * Performs template variable interpolation, hashtag sanitization, and truncation.
   */
  public static transformContent(
    template: string,
    variables: Record<string, any> = {},
    options: { maxCharLength?: number; appendHashtags?: string[] } = {}
  ): string {
    let output = template;

    // Safe variable interpolation {{varName}}
    Object.entries(variables).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      output = output.replace(regex, String(val ?? ''));
    });

    // Append hashtags if configured
    if (options.appendHashtags && options.appendHashtags.length > 0) {
      const tags = options.appendHashtags
        .map(t => (t.startsWith('#') ? t : `#${t}`))
        .join(' ');
      if (!output.includes(tags)) {
        output = `${output.trim()}\n\n${tags}`;
      }
    }

    // Max length formatting
    if (options.maxCharLength && output.length > options.maxCharLength) {
      output = output.substring(0, options.maxCharLength - 3) + '...';
    }

    return output.trim();
  }
}
