#!/usr/bin/env python3
"""
Enhanced Documentation Compliance Integration Script
Connects doc-compliance command with document-registry.json and DocumentLocationEnforcer
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from collections import defaultdict

# Import our sophisticated enforcer
try:
    from pre_tool_use_location_enforcer import DocumentLocationEnforcer
    ENFORCER_AVAILABLE = True
except ImportError:
    print("⚠️ DocumentLocationEnforcer not available. Install location enforcer first.")
    ENFORCER_AVAILABLE = False
    sys.exit(1)

class EnhancedDocCompliance:
    """
    Enhanced Documentation Compliance Agent that uses document-registry.json
    for intelligent document type detection and placement.
    """
    
    def __init__(self, project_root: str = None):
        if project_root is None:
            project_root = os.environ.get('PROJECT_ROOT', os.getcwd())
            
        self.project_root = project_root
        self.enforcer = DocumentLocationEnforcer()
        self.registry = self.enforcer.registry
        
        # Initialize statistics
        self.stats = {
            'scanned': 0,
            'detected': 0,
            'high_confidence': 0,
            'medium_confidence': 0,
            'low_confidence': 0,
            'moved': 0,
            'renamed': 0,
            'duplicates_found': 0,
            'references_updated': 0
        }
        
        # Migration plan
        self.migration_plan = {
            'auto_moves': [],      # >90% confidence
            'suggested_moves': [],  # 70-90% confidence
            'manual_review': [],    # <70% confidence
            'duplicates': [],       # Potential duplicates
            'broken_refs': []       # References to update
        }
    
    def scan_all_documents(self) -> List[str]:
        """Scan project for all markdown documents"""
        documents = []
        
        # Define scan paths
        scan_paths = [
            os.path.join(self.project_root, 'project_docs'),
            os.path.join(self.project_root, '.apm', 'session_notes'),
            self.project_root  # Root level docs
        ]
        
        for scan_path in scan_paths:
            if not os.path.exists(scan_path):
                continue
                
            for root, dirs, files in os.walk(scan_path):
                # Skip certain directories
                if any(skip in root for skip in ['.git', 'node_modules', '.apm/config']):
                    continue
                    
                for file in files:
                    if file.endswith('.md'):
                        full_path = os.path.join(root, file)
                        documents.append(full_path)
        
        self.stats['scanned'] = len(documents)
        return documents
    
    def analyze_document(self, doc_path: str) -> Dict:
        """Analyze a single document using multi-signal detection"""
        try:
            with open(doc_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return {
                'path': doc_path,
                'error': str(e),
                'doc_type': 'error',
                'confidence': 0
            }
        
        # Use enforcer's detection logic
        doc_type, confidence = self.enforcer.detect_document_type(
            doc_path,
            {'content': content},
            {'agent_persona': 'compliance'}
        )
        
        # Get correct location if detected
        correct_path = None
        if doc_type != 'uncertain' and confidence >= 50:
            correct_path = self.enforcer.get_correct_path(
                doc_type,
                doc_path,
                {'content': content}
            )
        
        analysis = {
            'path': doc_path,
            'doc_type': doc_type,
            'confidence': confidence,
            'correct_path': correct_path,
            'needs_move': correct_path != doc_path if correct_path else False,
            'content_length': len(content),
            'creation_date': datetime.fromtimestamp(os.path.getctime(doc_path)).isoformat()
        }
        
        self.stats['detected'] += 1
        
        # Categorize by confidence
        if confidence >= 90:
            self.stats['high_confidence'] += 1
        elif confidence >= 70:
            self.stats['medium_confidence'] += 1
        else:
            self.stats['low_confidence'] += 1
            
        return analysis
    
    def build_migration_plan(self, documents: List[str]) -> None:
        """Build intelligent migration plan based on confidence levels"""
        document_analyses = []
        
        print("🔍 Analyzing documents with multi-signal detection...")
        for i, doc_path in enumerate(documents, 1):
            analysis = self.analyze_document(doc_path)
            document_analyses.append(analysis)
            
            if i % 10 == 0:
                print(f"   Analyzed {i}/{len(documents)} documents...")
        
        print(f"✅ Analysis complete. Processing {len(document_analyses)} documents...\n")
        
        # Group by confidence levels
        for analysis in document_analyses:
            if analysis.get('error'):
                continue
                
            confidence = analysis['confidence']
            needs_move = analysis['needs_move']
            
            if not needs_move:
                continue  # Already in correct location
                
            if confidence >= 90:
                self.migration_plan['auto_moves'].append(analysis)
            elif confidence >= 70:
                self.migration_plan['suggested_moves'].append(analysis)
            else:
                self.migration_plan['manual_review'].append(analysis)
        
        # Find potential duplicates
        self.find_duplicates(document_analyses)
        
        # Find broken references
        self.find_broken_references(document_analyses)
    
    def find_duplicates(self, analyses: List[Dict]) -> None:
        """Find potential duplicate documents"""
        # Group by document type
        type_groups = defaultdict(list)
        for analysis in analyses:
            if analysis.get('doc_type') and analysis['doc_type'] != 'uncertain':
                type_groups[analysis['doc_type']].append(analysis)
        
        # Look for potential duplicates within each type
        for doc_type, docs in type_groups.items():
            if len(docs) < 2:
                continue
                
            # Simple duplicate detection based on filename similarity
            for i, doc1 in enumerate(docs):
                for doc2 in docs[i+1:]:
                    name1 = os.path.basename(doc1['path']).lower()
                    name2 = os.path.basename(doc2['path']).lower()
                    
                    # Check for similar names
                    if self.names_are_similar(name1, name2):
                        duplicate_group = {
                            'type': doc_type,
                            'documents': [doc1, doc2],
                            'similarity': 'filename'
                        }
                        
                        if duplicate_group not in self.migration_plan['duplicates']:
                            self.migration_plan['duplicates'].append(duplicate_group)
                            self.stats['duplicates_found'] += 1
    
    def names_are_similar(self, name1: str, name2: str) -> bool:
        """Simple similarity check for filenames"""
        # Remove extensions and common separators
        clean1 = name1.replace('.md', '').replace('-', '').replace('_', '')
        clean2 = name2.replace('.md', '').replace('-', '').replace('_', '')
        
        # Check if one contains the other or they're very similar
        return (clean1 in clean2 or clean2 in clean1 or 
                abs(len(clean1) - len(clean2)) <= 2 and 
                sum(c1 == c2 for c1, c2 in zip(clean1, clean2)) / max(len(clean1), len(clean2)) > 0.7)
    
    def find_broken_references(self, analyses: List[Dict]) -> None:
        """Find references that will be broken by moves"""
        move_map = {}
        
        # Build map of files that will be moved
        for analysis in (self.migration_plan['auto_moves'] + 
                        self.migration_plan['suggested_moves']):
            old_path = analysis['path']
            new_path = analysis['correct_path']
            move_map[old_path] = new_path
        
        if not move_map:
            return
        
        # Scan all documents for references
        for analysis in analyses:
            try:
                with open(analysis['path'], 'r') as f:
                    content = f.read()
                    
                # Look for markdown links and references
                for old_path, new_path in move_map.items():
                    old_name = os.path.basename(old_path)
                    if old_name in content or old_path in content:
                        self.migration_plan['broken_refs'].append({
                            'file': analysis['path'],
                            'old_ref': old_path,
                            'new_ref': new_path,
                            'old_name': old_name
                        })
                        
            except Exception:
                continue
    
    def print_migration_plan(self) -> None:
        """Display the migration plan for user review"""
        print("📋 INTELLIGENT MIGRATION PLAN")
        print("=" * 50)
        print(f"Documents scanned: {self.stats['scanned']}")
        print(f"Documents analyzed: {self.stats['detected']}")
        print(f"Detection accuracy: {((self.stats['high_confidence'] + self.stats['medium_confidence']) / self.stats['detected'] * 100):.1f}%")
        print()
        
        # High confidence moves
        if self.migration_plan['auto_moves']:
            print(f"🟢 HIGH CONFIDENCE (>90%) - Auto-approve ({len(self.migration_plan['auto_moves'])} files):")
            for analysis in self.migration_plan['auto_moves'][:5]:  # Show first 5
                print(f"  ✓ {os.path.basename(analysis['path'])} → {os.path.basename(analysis['correct_path'])}")
                print(f"    Type: {analysis['doc_type']} ({analysis['confidence']:.0f}% confidence)")
            if len(self.migration_plan['auto_moves']) > 5:
                print(f"    ... and {len(self.migration_plan['auto_moves']) - 5} more")
            print()
        
        # Medium confidence moves
        if self.migration_plan['suggested_moves']:
            print(f"🟡 MEDIUM CONFIDENCE (70-90%) - Review suggested ({len(self.migration_plan['suggested_moves'])} files):")
            for analysis in self.migration_plan['suggested_moves'][:3]:
                print(f"  ? {os.path.basename(analysis['path'])} → {os.path.basename(analysis['correct_path'])}")
                print(f"    Type: {analysis['doc_type']} ({analysis['confidence']:.0f}% confidence)")
            if len(self.migration_plan['suggested_moves']) > 3:
                print(f"    ... and {len(self.migration_plan['suggested_moves']) - 3} more")
            print()
        
        # Low confidence
        if self.migration_plan['manual_review']:
            print(f"🔴 LOW CONFIDENCE (<70%) - Manual classification ({len(self.migration_plan['manual_review'])} files):")
            for analysis in self.migration_plan['manual_review'][:3]:
                print(f"  ! {os.path.basename(analysis['path'])}")
                print(f"    Best guess: {analysis['doc_type']} ({analysis['confidence']:.0f}% confidence)")
            if len(self.migration_plan['manual_review']) > 3:
                print(f"    ... and {len(self.migration_plan['manual_review']) - 3} more")
            print()
        
        # Duplicates
        if self.migration_plan['duplicates']:
            print(f"🔄 DUPLICATES DETECTED ({len(self.migration_plan['duplicates'])} groups):")
            for dup in self.migration_plan['duplicates'][:2]:
                files = [os.path.basename(doc['path']) for doc in dup['documents']]
                print(f"  ⚠️ {dup['type']}: {' + '.join(files)}")
            if len(self.migration_plan['duplicates']) > 2:
                print(f"    ... and {len(self.migration_plan['duplicates']) - 2} more groups")
            print()
        
        # Broken references
        if self.migration_plan['broken_refs']:
            print(f"🔗 REFERENCES TO UPDATE ({len(self.migration_plan['broken_refs'])} files):")
            ref_files = set(ref['file'] for ref in self.migration_plan['broken_refs'])
            for ref_file in list(ref_files)[:3]:
                print(f"  📝 {os.path.basename(ref_file)}")
            if len(ref_files) > 3:
                print(f"    ... and {len(ref_files) - 3} more files")
    
    def execute_migration(self, mode: str = 'interactive') -> None:
        """Execute the migration plan"""
        if mode == 'auto' or self.confirm_migration():
            # Create backup first
            backup_dir = self.create_backup()
            print(f"💾 Backup created: {backup_dir}")
            
            try:
                # Execute high confidence moves
                self.execute_moves(self.migration_plan['auto_moves'], auto=True)
                
                # Execute medium confidence moves with confirmation
                if mode != 'auto':
                    self.execute_moves(self.migration_plan['suggested_moves'], auto=False)
                
                # Update references
                self.update_references()
                
                print(f"\n✅ Migration complete!")
                print(f"   Moved: {self.stats['moved']} files")
                print(f"   Renamed: {self.stats['renamed']} files")  
                print(f"   References updated: {self.stats['references_updated']}")
                
            except Exception as e:
                print(f"\n❌ Migration failed: {e}")
                print(f"   Backup available at: {backup_dir}")
                return False
                
        return True
    
    def confirm_migration(self) -> bool:
        """Ask user to confirm migration"""
        total_moves = len(self.migration_plan['auto_moves']) + len(self.migration_plan['suggested_moves'])
        
        if total_moves == 0:
            print("ℹ️ No migrations needed. All documents are properly located.")
            return False
            
        response = input(f"\nProceed with migration of {total_moves} documents? (y/n): ").lower()
        return response in ['y', 'yes']
    
    def create_backup(self) -> str:
        """Create timestamped backup of all documents"""
        timestamp = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
        backup_dir = os.path.join(self.project_root, '.apm', 'backups', f'compliance-{timestamp}')
        
        os.makedirs(backup_dir, exist_ok=True)
        
        # Backup all documents that will be affected
        for analysis in (self.migration_plan['auto_moves'] + 
                        self.migration_plan['suggested_moves']):
            src = analysis['path']
            rel_path = os.path.relpath(src, self.project_root)
            dst = os.path.join(backup_dir, rel_path)
            
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
        
        return backup_dir
    
    def execute_moves(self, moves: List[Dict], auto: bool = True) -> None:
        """Execute document moves"""
        for analysis in moves:
            src = analysis['path']
            dst = analysis['correct_path']
            
            if not auto:
                response = input(f"Move {os.path.basename(src)} to {os.path.basename(dst)}? (y/n/q): ").lower()
                if response == 'q':
                    break
                if response != 'y':
                    continue
            
            try:
                # Ensure destination directory exists
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                
                # Move file
                shutil.move(src, dst)
                
                # Update statistics
                if os.path.basename(src) != os.path.basename(dst):
                    self.stats['renamed'] += 1
                self.stats['moved'] += 1
                
                print(f"  ✓ Moved: {os.path.basename(src)} → {os.path.basename(dst)}")
                
            except Exception as e:
                print(f"  ❌ Failed to move {src}: {e}")
    
    def update_references(self) -> None:
        """Update references in files"""
        for ref in self.migration_plan['broken_refs']:
            try:
                with open(ref['file'], 'r') as f:
                    content = f.read()
                
                # Simple reference update (could be more sophisticated)
                old_name = os.path.basename(ref['old_ref'])
                new_name = os.path.basename(ref['new_ref'])
                
                if old_name in content:
                    new_content = content.replace(old_name, new_name)
                    
                    with open(ref['file'], 'w') as f:
                        f.write(new_content)
                    
                    self.stats['references_updated'] += 1
                    print(f"  🔗 Updated references in: {os.path.basename(ref['file'])}")
                    
            except Exception as e:
                print(f"  ❌ Failed to update references in {ref['file']}: {e}")

def main():
    """Main entry point for the enhanced doc-compliance script"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhanced Documentation Compliance with Registry')
    parser.add_argument('mode', choices=['organize', 'detect', 'registry', 'report'], 
                       help='Operation mode')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be done without making changes')
    parser.add_argument('--auto', action='store_true',
                       help='Auto-approve high confidence moves')
    parser.add_argument('--path', type=str,
                       help='Specific path to process')
    
    args = parser.parse_args()
    
    if not ENFORCER_AVAILABLE:
        print("❌ DocumentLocationEnforcer not available. Please install the location enforcer first.")
        sys.exit(1)
    
    # Initialize enhanced compliance
    compliance = EnhancedDocCompliance()
    
    if args.mode == 'organize':
        print("🚀 Enhanced Documentation Organization with Registry Integration")
        print("=" * 70)
        
        # Scan documents
        documents = compliance.scan_all_documents()
        print(f"📁 Found {len(documents)} markdown documents\n")
        
        if not documents:
            print("ℹ️ No documents found to organize.")
            return
        
        # Build migration plan
        compliance.build_migration_plan(documents)
        
        # Show plan
        compliance.print_migration_plan()
        
        # Execute if not dry run
        if not args.dry_run:
            mode = 'auto' if args.auto else 'interactive'
            compliance.execute_migration(mode)
        else:
            print("\n🔍 Dry run complete. Use --auto for automatic execution.")
    
    elif args.mode == 'detect':
        print("🔍 Document Type Detection Analysis")
        print("=" * 40)
        
        documents = compliance.scan_all_documents()
        
        for doc_path in documents[:10]:  # Show first 10
            analysis = compliance.analyze_document(doc_path)
            print(f"📄 {os.path.basename(analysis['path'])}")
            print(f"   Type: {analysis['doc_type']} ({analysis['confidence']:.0f}% confidence)")
            if analysis['needs_move']:
                print(f"   Should be: {os.path.basename(analysis['correct_path'])}")
            print()
    
    elif args.mode == 'registry':
        print("📋 Document Registry Status")
        print("=" * 30)
        
        registry = compliance.registry
        doc_types = registry.get('document_types', {})
        
        print(f"Registry version: {registry.get('version', 'unknown')}")
        print(f"Document types defined: {len(doc_types)}")
        print(f"Enforcement level: {registry.get('enforcement', {}).get('level', 'unknown')}")
        print()
        
        for doc_type, config in list(doc_types.items())[:5]:
            print(f"• {doc_type}")
            print(f"  Location: {config.get('location', 'undefined')}")
            print(f"  Type: {config.get('type', 'undefined')}")
            detection = config.get('detection', {})
            patterns = detection.get('filename_patterns', [])
            if patterns:
                print(f"  Patterns: {', '.join(patterns[:3])}")
            print()
    
    elif args.mode == 'report':
        print("📊 Enhanced Documentation Compliance Report")
        print("=" * 50)
        
        documents = compliance.scan_all_documents()
        compliance.build_migration_plan(documents)
        
        print(f"Documents scanned: {compliance.stats['scanned']}")
        print(f"High confidence detections: {compliance.stats['high_confidence']}")
        print(f"Medium confidence detections: {compliance.stats['medium_confidence']}")
        print(f"Low confidence detections: {compliance.stats['low_confidence']}")
        print(f"Potential duplicates: {compliance.stats['duplicates_found']}")
        print(f"References to update: {len(compliance.migration_plan['broken_refs'])}")
        
        if compliance.stats['detected'] > 0:
            accuracy = ((compliance.stats['high_confidence'] + 
                        compliance.stats['medium_confidence']) / 
                       compliance.stats['detected'] * 100)
            print(f"Detection accuracy: {accuracy:.1f}%")

if __name__ == "__main__":
    main()