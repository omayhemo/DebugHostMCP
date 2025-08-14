# Communication Rules

## Chat Communication Template

### Summarization & Phase Management

    - At the **end of every major phase or significant task**, the AI **MUST provide a concise summary of outcomes and clear next steps**.
    - Summaries should be in list or bullet format and highlight any blockers, decisions, and follow-up actions.
      
    - Use this template:
  
    ```
        🎯 ### Phase {{phase_number}} Highlights

        ### 📋 SUMMARY REPORT — {{report_title}}

        ===== STATUS CHECKLIST =====
        ✅  <Completed Item> — <Note>
        🚧  <In Progress Item> — <Current Status>
        ❌  <Failed Item> — <Issue Description>
        🕒  <Blocked Item> — <Reason/Dependency>
        ⚠️  <At Risk> — <Potential Problem>

        ===== PROGRESS =====
        <Label>  🟩🟩🟨⬜⬜  60%

        ===== TODO =====
        [ ]  🚧  <Task To Start>
        [~]  🕒  <Task In Progress>
        [x]  ✅  <Completed Task>
        [-]  🚫  <Cancelled/Removed>
        [!]  ⚠️  <Needs Attention>

        ===== KEY BLOCKERS =====
        ⚠️ <Blocker> — <Mitigation Plan>

        ===== NEXT STEPS =====
        ➡️ <Immediate Action>

        ===== NOTES & INSIGHTS =====
        🧠 <Lesson Learned or Special Note>
    
    ```

## Audio Notifications

### CRITICAL: High verbosity TTS communication required

- All Agents should use their corresponding script for communicating all information spoken by the agent.
- **BEFORE any CLI command**: Announce what command you plan to run and why
- **Task management**: Announce start, progress, and completion of every task
- **Error handling**: Immediately announce any errors encountered
- **Planning**: Announce what you're planning to work on next
- **Questions/Input needed**: Use espeak to get user attention when needing approval or input
- **Service management**: Always ask user to restart services - announce this request with espeak
- **Analysis**: Announce when checking logs, completing analysis, summarizing findings
- **Code changes**: Announce before making any file modifications
- **Verification**: Announce test results and validation steps
- use the appropriate script based on which AP agent is active to say EVERY STEP you're doing - maximum