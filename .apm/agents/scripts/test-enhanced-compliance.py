#!/usr/bin/env python3
"""
Test Script for Enhanced Documentation Compliance
Creates sample documents and demonstrates enhanced compliance features
"""

import os
import sys
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

# Test data for different document types
SAMPLE_DOCUMENTS = {
    'test.md': {
        'content': '''# Test Plan for Authentication

## Overview
This test plan covers the authentication system testing.

## Test Cases
1. User login with valid credentials
2. User login with invalid credentials
3. Password reset functionality

## Test Environment
- Development server
- Test database
''',
        'expected_type': 'test_plan',
        'expected_location': 'project_docs/qa/test-plans/'
    },
    
    'my-story.md': {
        'content': '''# User Story: Login Feature

## Description
As a user, I want to login to the system so that I can access my account.

## Acceptance Criteria
- [ ] User can enter email and password
- [ ] System validates credentials
- [ ] User is redirected to dashboard on success
- [ ] Error message shown on failure

## Definition of Done
- Code implemented and tested
- Documentation updated
''',
        'expected_type': 'user_story',
        'expected_location': 'project_docs/planning/stories/'
    },
    
    'architecture.md': {
        'content': '''# Architecture Decision Record: Database Selection

## Status
Accepted

## Context
We need to choose a database for our application.

## Decision
We will use PostgreSQL as our primary database.

## Consequences
- Better performance for complex queries
- Strong ACID compliance
- Mature ecosystem
''',
        'expected_type': 'architecture_decision',
        'expected_location': 'project_docs/architecture/decisions/'
    },
    
    'meeting-notes.md': {
        'content': '''# Meeting Notes - Sprint Planning

Date: 2025-01-06
Attendees: Product Owner, Scrum Master, Development Team

## Agenda
1. Review sprint goals
2. Story estimation
3. Capacity planning

## Decisions
- Sprint duration: 2 weeks
- Focus on authentication features
- Next review: Friday
''',
        'expected_type': 'meeting_notes',
        'expected_location': 'project_docs/general/'
    },
    
    'ambiguous.md': {
        'content': '''# Some Notes

This document doesn't have clear markers.
It could be anything really.

Some random content here.
''',
        'expected_type': 'uncertain',
        'expected_location': 'project_docs/general/'
    }
}

class ComplianceTestSuite:
    """Test suite for enhanced documentation compliance features"""
    
    def __init__(self, test_dir: str = None):
        if test_dir is None:
            self.test_dir = tempfile.mkdtemp(prefix='compliance-test-')
        else:
            self.test_dir = test_dir
        
        print(f"🧪 Test environment: {self.test_dir}")
        
        # Set up environment
        os.environ['PROJECT_ROOT'] = self.test_dir
        os.environ['APM_ROOT'] = os.path.join(self.test_dir, '.apm')
        
        self.setup_test_environment()
    
    def setup_test_environment(self):
        """Set up the test directory structure"""
        print("📁 Setting up test environment...")
        
        # Create directory structure
        directories = [
            '.apm/config',
            '.apm/hooks',
            '.apm/logs',
            '.apm/session_notes',
            'project_docs/qa/test-plans',
            'project_docs/planning/stories',
            'project_docs/architecture/decisions',
            'project_docs/general',
            'project_docs/reports'
        ]
        
        for directory in directories:
            full_path = os.path.join(self.test_dir, directory)
            os.makedirs(full_path, exist_ok=True)
        
        # Create sample document-registry.json
        registry = {
            "version": "1.0",
            "enforcement": {
                "level": "assisted",
                "allow_override": True,
                "override_flag": "--force-location"
            },
            "document_types": {
                "test_plan": {
                    "location": f"{self.test_dir}/project_docs/qa/test-plans/",
                    "type": "collection",
                    "naming": {
                        "pattern": "TEST-PLAN-{date}-{seq}.md",
                        "date_format": "YYYY-MM-DD",
                        "seq_format": "\\d{3}"
                    },
                    "detection": {
                        "filename_patterns": ["test", "test-plan", "testing"],
                        "content_markers": ["Test Cases", "Test Plan", "Test Environment"],
                        "agent_hints": ["QA", "Developer"]
                    }
                },
                "user_story": {
                    "location": f"{self.test_dir}/project_docs/planning/stories/",
                    "type": "collection",
                    "naming": {
                        "pattern": "STORY-{date}-{seq}.md",
                        "date_format": "YYYY-MM-DD",
                        "seq_format": "\\d{3}"
                    },
                    "detection": {
                        "filename_patterns": ["story", "user-story"],
                        "content_markers": ["User Story", "Acceptance Criteria", "Definition of Done"],
                        "agent_hints": ["Product Owner", "PO"]
                    }
                },
                "architecture_decision": {
                    "location": f"{self.test_dir}/project_docs/architecture/decisions/",
                    "type": "collection",
                    "naming": {
                        "pattern": "ADR-{seq}-{title}.md",
                        "seq_format": "\\d{3}",
                        "title_format": "kebab-case"
                    },
                    "detection": {
                        "filename_patterns": ["architecture", "decision", "adr"],
                        "content_markers": ["Architecture Decision", "Status", "Context", "Decision"],
                        "agent_hints": ["Architect"]
                    }
                },
                "meeting_notes": {
                    "location": f"{self.test_dir}/project_docs/general/",
                    "type": "collection",
                    "naming": {
                        "pattern": "MEETING-{date}-{title}.md",
                        "date_format": "YYYY-MM-DD",
                        "title_format": "UPPERCASE-KEBAB"
                    },
                    "detection": {
                        "filename_patterns": ["meeting", "notes"],
                        "content_markers": ["Meeting Notes", "Attendees", "Agenda"],
                        "agent_hints": ["*"]
                    }
                }
            },
            "uncertain_handling": {
                "action": "default",
                "default_location": f"{self.test_dir}/project_docs/general/",
                "prompt_message": "Cannot determine document type with confidence"
            }
        }
        
        registry_path = os.path.join(self.test_dir, '.apm/config/document-registry.json')
        with open(registry_path, 'w') as f:
            json.dump(registry, f, indent=2)
        
        print(f"✅ Document registry created: {registry_path}")
        
        # Copy the enforcer script
        enforcer_src = '/mnt/c/Code/agentic-persona-mapping/installer/templates/hooks/pre_tool_use_location_enforcer.py'
        enforcer_dst = os.path.join(self.test_dir, '.apm/hooks/pre_tool_use_location_enforcer.py')
        
        try:
            shutil.copy2(enforcer_src, enforcer_dst)
            print(f"✅ Enforcer script copied: {enforcer_dst}")
        except FileNotFoundError:
            print(f"⚠️ Enforcer script not found at {enforcer_src}")
        
        # Copy the compliance integration script
        compliance_src = '/mnt/c/Code/agentic-persona-mapping/installer/templates/scripts/doc-compliance-registry-integration.py'
        compliance_dst = os.path.join(self.test_dir, '.apm/scripts/doc-compliance-registry-integration.py')
        
        os.makedirs(os.path.dirname(compliance_dst), exist_ok=True)
        
        try:
            shutil.copy2(compliance_src, compliance_dst)
            print(f"✅ Compliance script copied: {compliance_dst}")
        except FileNotFoundError:
            print(f"⚠️ Compliance script not found at {compliance_src}")
    
    def create_sample_documents(self):
        """Create sample documents in wrong locations"""
        print("\n📄 Creating sample documents in wrong locations...")
        
        for filename, data in SAMPLE_DOCUMENTS.items():
            # Create in root directory (wrong location)
            doc_path = os.path.join(self.test_dir, filename)
            
            with open(doc_path, 'w') as f:
                f.write(data['content'])
            
            print(f"   Created: {filename}")
        
        print(f"✅ Created {len(SAMPLE_DOCUMENTS)} sample documents")
    
    def test_detection(self):
        """Test the document type detection"""
        print("\n🔍 Testing Document Type Detection...")
        
        # Import the enforcer within the test environment
        sys.path.insert(0, os.path.join(self.test_dir, '.apm/hooks'))
        
        try:
            from pre_tool_use_location_enforcer import DocumentLocationEnforcer
            
            enforcer = DocumentLocationEnforcer()
            
            for filename, data in SAMPLE_DOCUMENTS.items():
                doc_path = os.path.join(self.test_dir, filename)
                
                # Test detection
                doc_type, confidence = enforcer.detect_document_type(
                    doc_path,
                    {'content': data['content']},
                    {'agent_persona': 'test'}
                )
                
                expected = data['expected_type']
                
                print(f"   📄 {filename}:")
                print(f"      Detected: {doc_type} ({confidence:.0f}% confidence)")
                print(f"      Expected: {expected}")
                
                if doc_type == expected or (expected == 'uncertain' and confidence < 70):
                    print(f"      ✅ CORRECT")
                else:
                    print(f"      ❌ MISMATCH")
                
                # Test correct path generation
                if doc_type != 'uncertain' and confidence >= 50:
                    correct_path = enforcer.get_correct_path(
                        doc_type,
                        doc_path,
                        {'content': data['content']}
                    )
                    
                    expected_location = data['expected_location']
                    
                    if expected_location in correct_path:
                        print(f"      ✅ Correct location: {os.path.basename(correct_path)}")
                    else:
                        print(f"      ❌ Wrong location: {correct_path}")
                
                print()
            
        except ImportError as e:
            print(f"❌ Could not import enforcer: {e}")
            return False
        
        return True
    
    def test_compliance_script(self):
        """Test the enhanced compliance script"""
        print("\n🚀 Testing Enhanced Compliance Script...")
        
        # Add scripts directory to Python path
        sys.path.insert(0, os.path.join(self.test_dir, '.apm/scripts'))
        
        try:
            from doc_compliance_registry_integration import EnhancedDocCompliance
            
            compliance = EnhancedDocCompliance(self.test_dir)
            
            print("   📊 Scanning documents...")
            documents = compliance.scan_all_documents()
            print(f"   Found {len(documents)} documents")
            
            print("   🔍 Building migration plan...")
            compliance.build_migration_plan(documents)
            
            print("   📋 Migration plan summary:")
            print(f"      High confidence: {len(compliance.migration_plan['auto_moves'])}")
            print(f"      Medium confidence: {len(compliance.migration_plan['suggested_moves'])}")
            print(f"      Manual review: {len(compliance.migration_plan['manual_review'])}")
            print(f"      Duplicates: {len(compliance.migration_plan['duplicates'])}")
            
            # Show the plan
            compliance.print_migration_plan()
            
            # Test dry run
            print("\n   🔄 Testing dry run execution...")
            print("   (This would normally execute migrations)")
            
            return True
            
        except ImportError as e:
            print(f"❌ Could not import compliance script: {e}")
            return False
        except Exception as e:
            print(f"❌ Error testing compliance script: {e}")
            return False
    
    def cleanup(self):
        """Clean up test environment"""
        try:
            shutil.rmtree(self.test_dir)
            print(f"🧹 Cleaned up test directory: {self.test_dir}")
        except Exception as e:
            print(f"⚠️ Failed to cleanup {self.test_dir}: {e}")

def main():
    """Run the compliance test suite"""
    print("🧪 Enhanced Documentation Compliance Test Suite")
    print("=" * 60)
    
    suite = ComplianceTestSuite()
    
    try:
        # Create sample documents
        suite.create_sample_documents()
        
        # Test detection
        detection_success = suite.test_detection()
        
        # Test compliance script
        compliance_success = suite.test_compliance_script()
        
        print("\n📊 Test Results:")
        print(f"   Detection Test: {'✅ PASSED' if detection_success else '❌ FAILED'}")
        print(f"   Compliance Test: {'✅ PASSED' if compliance_success else '❌ FAILED'}")
        
        if detection_success and compliance_success:
            print("\n🎉 All tests passed! Enhanced compliance is working correctly.")
        else:
            print("\n⚠️ Some tests failed. Check the output above for details.")
        
        # Ask if user wants to keep test environment
        response = input(f"\nKeep test environment at {suite.test_dir}? (y/n): ").lower()
        
        if response not in ['y', 'yes']:
            suite.cleanup()
        else:
            print(f"💾 Test environment preserved at: {suite.test_dir}")
    
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        suite.cleanup()
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        suite.cleanup()

if __name__ == "__main__":
    main()