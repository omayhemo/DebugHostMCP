# Story 6.2: Team Management & Project Sharing

**Story ID**: 6.2  
**Epic**: Multi-User Support & Workspace Management (Epic 5)  
**Sprint**: 6  
**Story Points**: 8  
**Priority**: High  
**Created**: August 8, 2025  

## User Story

**As a** team lead  
**I want** to manage team members and share projects within the team  
**So that** my development team can collaborate effectively on shared projects while maintaining appropriate access controls  

## Business Value

- **Team Collaboration**: Enables teams to work together on shared development projects
- **Access Management**: Provides granular control over who can access which projects
- **Productivity**: Reduces setup time through project sharing and team templates
- **Governance**: Maintains oversight and control for team leads and administrators

## Acceptance Criteria

### Team Creation and Management
1. **GIVEN** a user with team creation permissions  
   **WHEN** they create a new team  
   **THEN** a team is established with the creator as team lead  

2. **GIVEN** a team lead manages their team  
   **WHEN** they invite users to join  
   **THEN** invitations are sent with appropriate role assignments  

3. **GIVEN** a user receives a team invitation  
   **WHEN** they accept the invitation  
   **THEN** they are added to the team with assigned permissions  

### Project Sharing Within Teams
4. **GIVEN** a team member has a project  
   **WHEN** they share it with their team  
   **THEN** team members can access the project based on their role permissions  

5. **GIVEN** a shared project exists in a team  
   **WHEN** team members access the project  
   **THEN** they can perform actions based on their assigned project permissions  

6. **GIVEN** a project is shared with specific team members  
   **WHEN** access is configured  
   **THEN** only designated members can access the shared project  

### Role-Based Team Permissions
7. **GIVEN** team roles are defined (Team Lead, Senior Developer, Developer, Viewer)  
   **WHEN** team members are assigned roles  
   **THEN** each role has appropriate permissions within the team context  

8. **GIVEN** a Team Lead manages permissions  
   **WHEN** they assign project-specific roles  
   **THEN** members have different access levels to different projects  

9. **GIVEN** a team member's role changes  
   **WHEN** the role update is applied  
   **THEN** their project access permissions are updated immediately  

### Team Resource Management
10. **GIVEN** a team has shared resource quotas  
    **WHEN** team members use resources  
    **THEN** resource usage is tracked and managed at the team level  

11. **GIVEN** team resource limits are approached  
    **WHEN** members attempt resource-intensive operations  
    **THEN** appropriate warnings and restrictions are applied  

12. **GIVEN** a team lead monitors resource usage  
    **WHEN** accessing team dashboard  
    **THEN** comprehensive resource usage by member and project is displayed  

### Collaboration Features
13. **GIVEN** team members work on shared projects  
    **WHEN** they make changes or updates  
    **THEN** other team members are notified of relevant changes  

14. **GIVEN** a team project has multiple contributors  
    **WHEN** viewing project activity  
    **THEN** all team member contributions are tracked and visible  

15. **GIVEN** team members need to communicate about projects  
    **WHEN** using collaboration features  
    **THEN** project-specific discussions and notifications are available  

## Technical Requirements

### Database Schema
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  resource_quota JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'developer',
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT unique_team_member UNIQUE(team_id, user_id)
);

CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES users(id),
  role VARCHAR(50) NOT NULL DEFAULT 'developer',
  invitation_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  shared_with_type VARCHAR(20) NOT NULL, -- 'team', 'user'
  shared_with_id UUID NOT NULL, -- team_id or user_id
  shared_by UUID REFERENCES users(id),
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_project_share UNIQUE(project_id, shared_with_type, shared_with_id)
);
```

### Team Role Definitions
```javascript
const teamRoles = {
  'team-lead': {
    name: 'Team Lead',
    permissions: [
      'team:manage',
      'team:invite',
      'team:remove-members',
      'project:create',
      'project:read',
      'project:update',
      'project:delete',
      'project:share',
      'resource:view',
      'resource:manage'
    ]
  },
  
  'senior-developer': {
    name: 'Senior Developer',
    permissions: [
      'team:view',
      'project:create',
      'project:read',
      'project:update',
      'project:share',
      'resource:view'
    ]
  },
  
  'developer': {
    name: 'Developer',
    permissions: [
      'team:view',
      'project:read',
      'project:update',
      'resource:view'
    ]
  },
  
  'viewer': {
    name: 'Viewer',
    permissions: [
      'team:view',
      'project:read',
      'resource:view'
    ]
  }
};
```

### Team Management Service
```typescript
class TeamManagementService {
  async createTeam(userId: string, teamData: CreateTeamRequest): Promise<Team> {
    const team = await db.teams.create({
      name: teamData.name,
      description: teamData.description,
      created_by: userId,
      resource_quota: teamData.resourceQuota || this.getDefaultTeamQuota()
    });

    // Add creator as team lead
    await db.team_members.create({
      team_id: team.id,
      user_id: userId,
      role: 'team-lead'
    });

    return team;
  }

  async inviteTeamMember(teamId: string, invitedBy: string, invitation: TeamInvitation) {
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.team_invitations.create({
      team_id: teamId,
      invited_email: invitation.email,
      invited_by: invitedBy,
      role: invitation.role,
      invitation_token: invitationToken,
      expires_at: expiresAt
    });

    await this.sendTeamInvitationEmail(invitation.email, invitationToken, teamId);
    return invitationToken;
  }

  async acceptTeamInvitation(invitationToken: string, userId: string) {
    const invitation = await db.team_invitations.findOne({
      invitation_token: invitationToken,
      expires_at: { $gt: new Date() },
      accepted_at: null,
      declined_at: null
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Add user to team
    await db.team_members.create({
      team_id: invitation.team_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by
    });

    // Mark invitation as accepted
    await db.team_invitations.update(
      { id: invitation.id },
      { accepted_at: new Date() }
    );
  }
}
```

### Project Sharing Service
```typescript
class ProjectSharingService {
  async shareProjectWithTeam(
    projectId: string, 
    teamId: string, 
    permissions: ProjectPermissions,
    sharedBy: string
  ) {
    // Verify user has permission to share this project
    await this.validateProjectSharePermission(projectId, sharedBy);

    await db.project_shares.upsert({
      project_id: projectId,
      shared_with_type: 'team',
      shared_with_id: teamId,
      shared_by: sharedBy,
      permissions: permissions
    });

    // Notify team members of new shared project
    await this.notifyTeamOfSharedProject(teamId, projectId);
  }

  async getAccessibleProjects(userId: string): Promise<Project[]> {
    // Get user's own projects
    const ownProjects = await db.projects.findAll({
      where: { created_by: userId }
    });

    // Get projects shared with user's teams
    const teamSharedProjects = await db.projects.findAll({
      include: [{
        model: db.project_shares,
        where: {
          shared_with_type: 'team',
          shared_with_id: {
            $in: await this.getUserTeamIds(userId)
          }
        }
      }]
    });

    // Get projects shared directly with user
    const directSharedProjects = await db.projects.findAll({
      include: [{
        model: db.project_shares,
        where: {
          shared_with_type: 'user',
          shared_with_id: userId
        }
      }]
    });

    return [...ownProjects, ...teamSharedProjects, ...directSharedProjects];
  }
}
```

### API Endpoints
```typescript
// Team management endpoints
POST   /api/teams                    // Create team
GET    /api/teams                    // List user's teams
GET    /api/teams/:id                // Get team details
PUT    /api/teams/:id                // Update team
DELETE /api/teams/:id                // Delete team

POST   /api/teams/:id/invite         // Invite team member
POST   /api/teams/invitations/accept // Accept invitation
DELETE /api/teams/:id/members/:userId // Remove team member

// Project sharing endpoints
POST   /api/projects/:id/share       // Share project
GET    /api/projects/shared          // List accessible projects
DELETE /api/projects/:id/share/:shareId // Unshare project
```

## Dependencies

### Prerequisites
- Story 6.1 (User Workspace Isolation Architecture) - **REQUIRED**
- Stories 5.1-5.3 (Authentication and RBAC) - **REQUIRED**
- Email service for team invitations
- Notification system for team updates

### External Libraries
- `nodemailer` - Email sending for invitations
- `joi` - Input validation for team management
- `lodash` - Permission calculation utilities

## Testing Strategy

### Unit Tests
- Team creation and management logic
- Role-based permission calculations
- Project sharing permission validation
- Team invitation workflow
- Resource quota calculations for teams

### Integration Tests
- Complete team collaboration workflow
- Project sharing across team members
- Permission inheritance and enforcement
- Team invitation and acceptance process
- Resource usage tracking for teams

### Security Tests
- Project access boundary enforcement
- Team permission escalation prevention
- Invitation token security validation
- Cross-team access prevention
- Resource quota bypass attempts

## Definition of Done

- [ ] Team creation and management functionality
- [ ] Team member invitation and role assignment
- [ ] Project sharing with granular permissions
- [ ] Role-based access control for team features
- [ ] Team resource quota management
- [ ] Email invitation system functional
- [ ] Team dashboard with member and project overview
- [ ] Notification system for team activities
- [ ] API endpoints for team operations
- [ ] Comprehensive test suite (>85% coverage)
- [ ] Documentation for team management features
- [ ] Performance optimization for team queries

## Security Considerations

### Access Control
- **Team Boundaries**: Strict enforcement of team membership
- **Project Sharing**: Secure validation of sharing permissions
- **Role Permissions**: Proper role-based access control
- **Invitation Security**: Secure token generation and validation

### Data Protection
- **Project Isolation**: Maintain project security within teams
- **Resource Limits**: Prevent team-level resource abuse
- **Audit Trail**: Log all team and sharing activities
- **Permission Changes**: Immediate application of role changes

## Story Sizing Justification (8 Points)

This is a **medium-high complexity** story requiring:
- Team management system with role-based permissions
- Project sharing functionality with granular access control
- Database schema extensions for teams and sharing
- Email invitation system with secure token handling
- Integration with existing authentication and workspace isolation
- Resource quota management at team level
- Notification system for team activities

The 8-point estimate reflects the multiple interconnected systems required for team collaboration while building on existing authentication and workspace infrastructure.

---

*This story enables team-based collaboration while maintaining security boundaries and proper access control within the multi-user platform.*