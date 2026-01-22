# SOP Builder Knowledge Base

## Discovery Framework

### Stage 1: Fundamental Questions (MUST ASK ALL)

These questions establish purpose, scope, operator context, environment, and success criteria. Every question must be answered before proceeding.

**Objective & Problem**
- What is the primary objective of this SOP?
- What problem does it solve?

**Scope & Boundaries**
- Where does this SOP start and end?
- What is explicitly out of scope?

**Operator Context**
- Who is this SOP written for?
- What level of experience is assumed for the operator?

**Environment & Tools**
- Which tools or platforms are involved?
- Where is this process performed? (e.g. local device, browser, specific SaaS tools)

**Success & Failure**
- What outcomes define success?
- What outcomes define failure?

**Stage 1 Completion Criteria:**
- No unanswered questions
- No ambiguity remains
- Scope boundaries are explicit

---

### Stage 2: Granular Decomposition

Decompose the process into executable, sequential SOP elements.

**Prerequisites**
- What must be completed before this SOP begins?
- What inputs, access, or approvals are required?

**Step Sequencing**
- What are the major steps?
- How is each step performed?
- Why is the order important?
- How does each step connect to the next?

**Tool Actions**
- What actions occur in each tool?
- Which settings are critical?
- What defaults are acceptable?

**Indicators of Success**
- What confirms correct execution?
- What signals the operator is on track?

**Edge Cases & Escalation**
- What commonly goes wrong?
- How should the operator respond?
- When is escalation required?

**Decision Points**
- Are there points where the operator must evaluate before proceeding?
- What conditions lead to different actions?
- What if the situation is ambiguous?
- When should they escalate vs decide themselves?

**Dependencies**
- Are other SOPs referenced or required?
- Should logic be linked instead of duplicated?

**Stage 2 Completion Criteria:**
- All SOP elements are fully defined
- No step requires guesswork
- All edge cases are addressed

---

### Final Validation Litmus Test

Before writing the SOP, ask:

> "If I follow this SOP with only foundational knowledge, will I ever be blocked, confused, or forced to guess?"

- If YES → Return to discovery
- If NO → Proceed to SOP creation

---

## YAML Output Format

### Standard Step
```yaml
- title: Step Title
  content: |
    1. First instruction
    2. Second instruction with **bold UI element**
    3. Third instruction

    > Note: Important tip or warning
```

### Decision Step
Use `type: decision` when operators must evaluate conditions and take different paths.

```yaml
- title: Determine Customer Tier
  type: decision
  content: |
    DECISION: What service level applies to this customer?

    CHECK 1: Is this an enterprise customer (>$50k ACV)?

        → YES
            ✓ Action: Use PREMIUM support path
              • Assign dedicated account manager
              • Enable priority ticket queue

        → NO
            ✓ Action: Continue to Check 2

    CHECK 2: Does customer have technical team?

        → YES (developers or technical admins)
            ✓ Action: Use SELF-SERVICE path
              • Provide API documentation
              • Grant sandbox access

        → NO (non-technical team)
            ✓ Action: Use GUIDED path
              • Schedule onboarding call
              • Send video tutorials

        → UNSURE
            • Review company LinkedIn
            • Ask during kickoff call
            • Default to GUIDED if still unclear

    ⚠️ ESCALATE IF:
        • Customer requests custom arrangement
        • Contract has specific SLA requirements
        • Regulated industry (healthcare, finance)
```

### Decision Tree Format Rules
1. Start with `DECISION: [main question]`
2. Use `CHECK N:` for each evaluation question
3. Indent branches 4 spaces under each check
4. Use `→ YES`, `→ NO`, `→ UNSURE` for branches
5. Use `✓ Action:` for outcomes
6. Use `•` bullets for details
7. End with `⚠️ ESCALATE IF:` section

### General YAML Rules
1. Use `|` for all multiline strings
2. Bold UI elements: `**Button Name**`
3. Number sequential sub-steps
4. Use `>` blockquotes for notes/warnings
5. Tags: lowercase, hyphenated
6. Step titles: action-oriented verbs

---

## SOP Improvement Guidelines

### Common Issues to Fix

**Vague Instructions**
- Before: "Update the settings"
- After: "Navigate to **Settings > Preferences** and set **Notification Frequency** to **Daily**"

**Missing Success Indicators**
- Add: "You should see a green 'Saved' confirmation banner"

**Hidden Decision Logic**
- Before: "If the customer is enterprise, use white glove onboarding, otherwise use standard"
- After: Convert to `type: decision` step with proper CHECK/branches

**Buried Exceptions**
- Before: Long paragraph with "however" and "except when"
- After: Explicit branches or escalation conditions

### Gap Flagging Format

When information is missing and cannot be inferred:
```yaml
- title: Configure Integration
  content: |
    1. Navigate to **Integrations** page
    2. [NEEDS CLARIFICATION: Which specific integration? Multiple options exist]
    3. Enter the API key
    [NEEDS CLARIFICATION: Where does the operator obtain this API key?]
```

### When to Convert to Decision Tree

Convert a step to `type: decision` when:
- Instructions contain "if/then/else" logic
- Multiple paths depend on evaluation
- The step says "it depends" or "varies based on"
- Operators frequently ask "but what if...?"

### Improvement Checklist

Before finalizing, verify:
- [ ] All steps executable without guesswork
- [ ] UI elements are specific and bolded
- [ ] Decision logic is explicit, not buried
- [ ] Edge cases have clear handling
- [ ] Escalation conditions defined
- [ ] Success indicators present
- [ ] Gaps flagged with [NEEDS CLARIFICATION]
