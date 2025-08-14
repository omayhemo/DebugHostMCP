# Python Task Manager Integration

## Overview
How the AP Python Task Manager can coordinate with Claude Code's parallel subtask execution.

## Integration Architecture

```python
# Enhanced TaskService for parallel coordination
from typing import List, Dict, Any, Optional
from uuid import UUID
from ..domain.entities import Task, TaskStatus

class ParallelTaskCoordinator:
    """Coordinates between Python task manager and Claude Code parallel execution."""
    
    def __init__(self, task_service: TaskService):
        self.task_service = task_service
        self.template_registry = SubtaskTemplateRegistry()
    
    async def prepare_parallel_execution(
        self,
        parent_task_id: UUID,
        analysis_type: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Prepare data structure for Claude Code parallel execution."""
        
        # Get parent task
        parent_task = await self.task_service.repository.get(parent_task_id)
        if not parent_task:
            raise ValueError(f"Parent task {parent_task_id} not found")
        
        # Select appropriate subtask templates
        templates = self.template_registry.get_templates_for_analysis(analysis_type)
        
        # Prepare execution context
        execution_context = {
            "parent_task": {
                "id": str(parent_task.id),
                "title": parent_task.title,
                "context": parent_task.metadata
            },
            "analysis_type": analysis_type,
            "subtask_templates": templates,
            "synthesis_pattern": self._select_synthesis_pattern(analysis_type),
            "execution_constraints": {
                "max_parallel": 7,
                "timeout_minutes": 10,
                "output_format": "yaml"
            }
        }
        
        # Update parent task status
        await self.task_service.transition_status(
            parent_task_id,
            TaskStatus.IN_PROGRESS,
            "parallel-coordinator"
        )
        
        # Add event for tracking
        parent_task.add_event(
            "parallel_execution_started",
            "system",
            {
                "subtask_count": len(templates),
                "analysis_type": analysis_type
            }
        )
        
        return execution_context
    
    async def process_parallel_results(
        self,
        parent_task_id: UUID,
        results: List[Dict[str, Any]],
        synthesis_pattern: str
    ) -> Dict[str, Any]:
        """Process results from parallel subtask execution."""
        
        # Apply synthesis pattern
        synthesizer = self._get_synthesizer(synthesis_pattern)
        synthesized_results = synthesizer.synthesize(results)
        
        # Update parent task with results
        parent_task = await self.task_service.repository.get(parent_task_id)
        parent_task.metadata["parallel_execution_results"] = synthesized_results
        parent_task.add_event(
            "parallel_execution_completed",
            "system",
            {
                "subtasks_completed": len(results),
                "synthesis_pattern": synthesis_pattern,
                "findings_count": synthesized_results.get("total_findings", 0)
            }
        )
        
        # Create child tasks for critical findings
        critical_findings = synthesized_results.get("critical_findings", [])
        for finding in critical_findings:
            await self._create_finding_task(parent_task, finding)
        
        await self.task_service.repository.save(parent_task)
        
        return synthesized_results
```

## Template Registry

```python
class SubtaskTemplateRegistry:
    """Registry of available subtask templates."""
    
    def __init__(self):
        self.templates = {
            "developer_code_review": [
                "security-scan",
                "performance-check",
                "test-coverage",
                "code-complexity",
                "dependency-audit"
            ],
            "qa_comprehensive_test": [
                "cross-browser-chrome",
                "cross-browser-firefox", 
                "cross-browser-safari",
                "accessibility-audit",
                "api-contract-test"
            ],
            "po_story_validation": [
                "story-completeness",
                "acceptance-criteria",
                "dependency-check",
                "effort-validation"
            ],
            "analyst_market_research": [
                "competitor-analysis",
                "market-sizing",
                "user-segments",
                "technology-trends"
            ]
        }
    
    def get_templates_for_analysis(self, analysis_type: str) -> List[Dict[str, Any]]:
        """Get template definitions for a specific analysis type."""
        template_names = self.templates.get(analysis_type, [])
        return [self._load_template(name) for name in template_names]
    
    def _load_template(self, template_name: str) -> Dict[str, Any]:
        """Load template definition from file."""
        # In practice, this would read from the subtask template files
        return {
            "name": template_name,
            "path": f"/subtasks/{template_name}.md",
            "timeout_minutes": 5,
            "output_format": "yaml"
        }
```

## Synthesis Integration

```python
from abc import ABC, abstractmethod

class SynthesisStrategy(ABC):
    """Base class for synthesis strategies."""
    
    @abstractmethod
    def synthesize(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Synthesize multiple results into unified output."""
        pass

class RiskMatrixSynthesizer(SynthesisStrategy):
    """Synthesize results using risk matrix pattern."""
    
    def synthesize(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        findings = []
        
        # Collect all findings
        for result in results:
            if result.get("status") == "success":
                findings.extend(result.get("findings", []))
        
        # Calculate risk scores
        risk_matrix = self._build_risk_matrix(findings)
        
        # Group by priority
        return {
            "synthesis_type": "risk_matrix",
            "total_findings": len(findings),
            "critical_findings": risk_matrix["critical"],
            "high_priority": risk_matrix["high"],
            "medium_priority": risk_matrix["medium"],
            "low_priority": risk_matrix["low"],
            "risk_summary": self._generate_risk_summary(risk_matrix)
        }
```

## Usage Example

```python
# In Developer persona context
async def perform_code_review(file_path: str):
    """Perform comprehensive parallel code review."""
    
    # Create parent task
    parent_task = await task_service.create_task(
        title=f"Code review for {file_path}",
        description="Comprehensive parallel analysis",
        assignee=AgentType.DEVELOPER
    )
    
    # Prepare for parallel execution
    coordinator = ParallelTaskCoordinator(task_service)
    execution_context = await coordinator.prepare_parallel_execution(
        parent_task.id,
        "developer_code_review",
        {"file_path": file_path}
    )
    
    # This is where Claude Code would execute parallel tasks
    # The execution_context contains all needed information
    
    # After Claude Code completes parallel execution:
    results = [...]  # Results from parallel subtasks
    
    # Process and synthesize results
    final_results = await coordinator.process_parallel_results(
        parent_task.id,
        results,
        "risk_matrix"
    )
    
    return final_results
```

## Benefits

1. **Tracking**: All parallel executions tracked in task system
2. **Persistence**: Results stored for future reference
3. **Actionability**: Critical findings become tasks
4. **Metrics**: Performance and quality metrics captured
5. **Integration**: Seamless with existing AP workflow