# Story 7.4: Template Marketplace & Discovery

**Story ID**: 7.4  
**Epic**: Project Templates & Development Accelerators (Epic 6)  
**Sprint**: 7  
**Story Points**: 8  
**Priority**: Medium-High  
**Created**: August 8, 2025  

## User Story

**As a** developer  
**I want** a searchable marketplace for project templates with ratings and reviews  
**So that** I can discover, evaluate, and use high-quality templates created by the community and my organization  

## Business Value

- **Community Knowledge Sharing**: Enables developers to share and benefit from collective expertise
- **Quality Assurance**: Rating and review system helps identify high-quality templates
- **Discovery**: Advanced search and filtering helps developers find relevant templates quickly
- **Innovation**: Accelerates development by leveraging proven patterns and solutions

## Acceptance Criteria

### Template Marketplace Browse and Search
1. **GIVEN** developers want to find templates  
   **WHEN** they access the template marketplace  
   **THEN** they can browse templates by category, popularity, and recency  

2. **GIVEN** users need specific templates  
   **WHEN** they search using keywords  
   **THEN** relevant templates are found based on name, description, tags, and content  

3. **GIVEN** many templates are available  
   **WHEN** users apply filters  
   **THEN** templates can be filtered by technology stack, complexity, rating, and organization  

### Template Information and Preview
4. **GIVEN** a user views a template in the marketplace  
   **WHEN** they examine template details  
   **THEN** comprehensive information including description, requirements, and example output is shown  

5. **GIVEN** users want to evaluate template quality  
   **WHEN** viewing template information  
   **THEN** ratings, reviews, usage statistics, and maintenance status are displayed  

6. **GIVEN** templates have example projects  
   **WHEN** users preview templates  
   **THEN** sample configurations and generated file structures are shown  

### Template Rating and Review System
7. **GIVEN** users have used a template  
   **WHEN** they want to provide feedback  
   **THEN** they can rate templates (1-5 stars) and write detailed reviews  

8. **GIVEN** multiple users review templates  
   **WHEN** calculating template ratings  
   **THEN** average ratings and review counts are accurately displayed  

9. **GIVEN** template reviews exist  
   **WHEN** users read reviews  
   **THEN** reviews include ratings, comments, reviewer information, and helpful indicators  

### Template Categories and Curation
10. **GIVEN** templates are organized for discovery  
    **WHEN** users browse by category  
    **THEN** templates are grouped into logical categories (Web Apps, APIs, Mobile, DevOps, etc.)  

11. **GIVEN** high-quality templates exist  
    **WHEN** curation occurs  
    **THEN** featured templates and "staff picks" are highlighted prominently  

12. **GIVEN** templates may become outdated  
    **WHEN** templates are no longer maintained  
    **THEN** deprecation warnings and alternative suggestions are provided  

### Template Installation and Usage Tracking
13. **GIVEN** users find useful templates  
    **WHEN** they install/use templates  
    **THEN** one-click installation with customization options is available  

14. **GIVEN** templates are used  
    **WHEN** tracking usage metrics  
    **THEN** download counts, success rates, and popularity trends are recorded  

15. **GIVEN** users have used multiple templates  
    **WHEN** they view their template history  
    **THEN** previously used templates and their configurations are accessible  

### Community Features
16. **GIVEN** developers create valuable templates  
    **WHEN** they want recognition  
    **THEN** contributor profiles show their templates, ratings, and community impact  

17. **GIVEN** templates need improvements  
    **WHEN** users identify issues  
    **THEN** feedback mechanisms allow reporting bugs, requesting features, and suggesting improvements  

## Technical Requirements

### Template Marketplace Database Schema
```sql
CREATE TABLE template_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES custom_templates(id) ON DELETE CASCADE,
  
  -- Publication details
  published_at TIMESTAMP DEFAULT NOW(),
  published_by UUID REFERENCES users(id),
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Statistics
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  
  -- Ratings
  rating_average NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, deprecated, removed
  deprecated_reason TEXT,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES custom_templates(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  review_text TEXT,
  
  -- Review metadata
  helpful_votes INTEGER DEFAULT 0,
  verified_user BOOLEAN DEFAULT FALSE, -- user has actually used template
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_review_per_user UNIQUE(template_id, reviewer_id)
);

CREATE TABLE template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  parent_category_id UUID REFERENCES template_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE template_tags (
  template_id UUID REFERENCES custom_templates(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (template_id, tag)
);

CREATE TABLE template_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES custom_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  project_name VARCHAR(100),
  variables_used JSONB,
  success BOOLEAN,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Marketplace Service Implementation
```typescript
class TemplateMarketplaceService {
  async getMarketplaceTemplates(
    filters: MarketplaceFilters = {}
  ): Promise<MarketplaceTemplate[]> {
    
    const query = db.custom_templates.createQueryBuilder('template')
      .leftJoin('template.marketplace', 'marketplace')
      .leftJoin('template.reviews', 'reviews')
      .where('marketplace.status = :status', { status: 'active' });

    // Apply category filter
    if (filters.category) {
      query.andWhere('template.category = :category', { category: filters.category });
    }

    // Apply technology stack filter
    if (filters.technologies && filters.technologies.length > 0) {
      query.andWhere('template.tags @> :technologies', { 
        technologies: JSON.stringify(filters.technologies) 
      });
    }

    // Apply rating filter
    if (filters.minRating) {
      query.andWhere('marketplace.rating_average >= :minRating', { 
        minRating: filters.minRating 
      });
    }

    // Apply search
    if (filters.search) {
      query.andWhere(`(
        template.name ILIKE :search OR 
        template.description ILIKE :search OR 
        EXISTS(
          SELECT 1 FROM template_tags tt 
          WHERE tt.template_id = template.id 
          AND tt.tag ILIKE :search
        )
      )`, { search: `%${filters.search}%` });
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'popularity':
        query.orderBy('marketplace.download_count', 'DESC');
        break;
      case 'rating':
        query.orderBy('marketplace.rating_average', 'DESC');
        break;
      case 'newest':
        query.orderBy('marketplace.published_at', 'DESC');
        break;
      default:
        query.orderBy('marketplace.is_featured', 'DESC')
             .addOrderBy('marketplace.rating_average', 'DESC');
    }

    const templates = await query.getMany();
    return templates.map(this.mapToMarketplaceTemplate);
  }

  async getTemplateDetails(templateId: string): Promise<TemplateDetails> {
    const template = await db.custom_templates.findOne({
      where: { id: templateId },
      relations: ['marketplace', 'reviews', 'reviews.reviewer', 'versions']
    });

    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    const stats = await this.getTemplateStatistics(templateId);
    const reviews = await this.getTemplateReviews(templateId);
    
    return {
      ...template,
      statistics: stats,
      reviews: reviews,
      relatedTemplates: await this.getRelatedTemplates(template)
    };
  }

  async submitTemplateReview(
    templateId: string, 
    userId: string, 
    review: TemplateReview
  ): Promise<void> {
    
    // Check if user has actually used the template
    const hasUsed = await this.hasUserUsedTemplate(userId, templateId);
    
    await db.template_reviews.upsert({
      template_id: templateId,
      reviewer_id: userId,
      rating: review.rating,
      title: review.title,
      review_text: review.text,
      verified_user: hasUsed
    });

    // Update aggregate rating
    await this.updateTemplateRating(templateId);
  }

  async trackTemplateUsage(
    templateId: string,
    userId: string,
    usageData: TemplateUsageData
  ): Promise<void> {
    
    await db.template_usage_tracking.create({
      template_id: templateId,
      user_id: userId,
      project_name: usageData.projectName,
      variables_used: usageData.variables,
      success: usageData.success,
      error_message: usageData.errorMessage,
      duration_ms: usageData.durationMs
    });

    // Update usage statistics
    await db.template_marketplace.increment(
      { template_id: templateId },
      'usage_count',
      1
    );
  }

  private async getRelatedTemplates(template: Template): Promise<Template[]> {
    // Find templates with similar tags or category
    return db.custom_templates.createQueryBuilder('t')
      .leftJoin('t.marketplace', 'm')
      .where('t.category = :category', { category: template.category })
      .andWhere('t.id != :templateId', { templateId: template.id })
      .andWhere('m.status = :status', { status: 'active' })
      .orderBy('m.rating_average', 'DESC')
      .limit(5)
      .getMany();
  }
}
```

### Marketplace UI Components
```typescript
const TemplateMarketplace: React.FC = () => {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadTemplates();
  }, [filters]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await marketplaceService.getMarketplaceTemplates(filters);
      setTemplates(result);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="template-marketplace">
      <MarketplaceHeader />
      
      <div className="marketplace-content">
        <aside className="marketplace-sidebar">
          <SearchFilters 
            filters={filters}
            onFiltersChange={setFilters}
          />
          <FeaturedTemplates />
          <PopularCategories />
        </aside>
        
        <main className="marketplace-main">
          <div className="marketplace-toolbar">
            <SearchBar 
              value={filters.search || ''}
              onChange={(search) => setFilters({ ...filters, search })}
            />
            <SortSelector
              value={filters.sortBy || 'featured'}
              onChange={(sortBy) => setFilters({ ...filters, sortBy })}
            />
          </div>
          
          {loading ? (
            <LoadingSpinner />
          ) : (
            <TemplateGrid templates={templates} />
          )}
        </main>
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{ template: MarketplaceTemplate }> = ({ template }) => {
  return (
    <div className="template-card" onClick={() => navigateToTemplate(template.id)}>
      <div className="template-header">
        <h3 className="template-name">{template.displayName}</h3>
        {template.isFeatured && <Badge variant="featured">Featured</Badge>}
        {template.isVerified && <Badge variant="verified">Verified</Badge>}
      </div>
      
      <p className="template-description">{template.description}</p>
      
      <div className="template-tags">
        {template.tags.slice(0, 3).map(tag => (
          <Tag key={tag} size="small">{tag}</Tag>
        ))}
        {template.tags.length > 3 && (
          <span className="more-tags">+{template.tags.length - 3} more</span>
        )}
      </div>
      
      <div className="template-stats">
        <div className="rating">
          <StarRating value={template.rating} readonly />
          <span className="rating-count">({template.ratingCount})</span>
        </div>
        
        <div className="usage-stats">
          <Icon name="download" />
          <span>{formatNumber(template.downloadCount)}</span>
        </div>
      </div>
      
      <div className="template-author">
        <Avatar src={template.author.avatar} size="small" />
        <span>{template.author.name}</span>
      </div>
    </div>
  );
};

const TemplateDetailsModal: React.FC<{
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ templateId, isOpen, onClose }) => {
  
  const [template, setTemplate] = useState<TemplateDetails | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'reviews' | 'changelog'>('overview');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="template-details">
        <header className="template-details-header">
          <div className="template-info">
            <h1>{template?.displayName}</h1>
            <p className="template-description">{template?.description}</p>
            
            <div className="template-metadata">
              <StarRating value={template?.rating || 0} readonly />
              <span>by {template?.author.name}</span>
              <span>v{template?.version}</span>
              <span>Updated {formatDate(template?.updatedAt)}</span>
            </div>
          </div>
          
          <div className="template-actions">
            <button 
              className="primary-button"
              onClick={() => useTemplate(template)}
            >
              Use Template
            </button>
            <button onClick={() => previewTemplate(template)}>
              Preview
            </button>
          </div>
        </header>
        
        <nav className="template-details-nav">
          <button 
            className={selectedTab === 'overview' ? 'active' : ''}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </button>
          <button 
            className={selectedTab === 'reviews' ? 'active' : ''}
            onClick={() => setSelectedTab('reviews')}
          >
            Reviews ({template?.reviews.length})
          </button>
          <button 
            className={selectedTab === 'changelog' ? 'active' : ''}
            onClick={() => setSelectedTab('changelog')}
          >
            Changelog
          </button>
        </nav>
        
        <div className="template-details-content">
          {selectedTab === 'overview' && (
            <TemplateOverview template={template} />
          )}
          {selectedTab === 'reviews' && (
            <TemplateReviews 
              reviews={template?.reviews || []}
              onSubmitReview={(review) => submitReview(template?.id, review)}
            />
          )}
          {selectedTab === 'changelog' && (
            <TemplateChangelog versions={template?.versions || []} />
          )}
        </div>
      </div>
    </Modal>
  );
};
```

## Dependencies

### Prerequisites
- Stories 7.1-7.3 (Template engine, library, and creation UI) - **REQUIRED**
- Enhanced search and filtering capabilities
- User rating and review system
- Community features and user profiles

### External Libraries
- `elasticsearch` or `algolia` - Advanced search capabilities
- `react-select` - Advanced filtering UI
- `react-infinite-scroll-component` - Infinite scrolling for template lists
- `react-stars` - Star rating components

## Testing Strategy

### Unit Tests
- Template search and filtering logic
- Rating calculation algorithms
- Review submission and validation
- Usage tracking accuracy
- Template categorization

### Integration Tests
- Complete marketplace browsing workflow
- Template installation from marketplace
- Review and rating system functionality
- Search performance and accuracy
- Community feature interactions

### Performance Tests
- Search response times with large template catalogs
- Marketplace page load performance
- Concurrent user rating and review submission
- Database query optimization validation

## Definition of Done

- [ ] Template marketplace with search and filtering
- [ ] Template categories and featured template highlighting
- [ ] Rating and review system for templates
- [ ] Template usage tracking and statistics
- [ ] Community features and contributor profiles
- [ ] Advanced search with multiple filter options
- [ ] Template preview and detailed information views
- [ ] One-click template installation workflow
- [ ] Mobile-responsive marketplace interface
- [ ] Performance optimization for large template catalogs
- [ ] Comprehensive test suite (>85% coverage)
- [ ] Analytics dashboard for marketplace insights
- [ ] Content moderation tools for reviews

## Performance Requirements

### Search and Discovery Performance
- Template search results: <500ms response time
- Marketplace page load: <3 seconds initial load
- Filter application: <300ms response time
- Template detail view: <2 seconds load time

### Scalability Targets
- Support 10,000+ templates in marketplace
- Handle 1000+ concurrent marketplace users
- Process 10,000+ template downloads per day
- Manage 50,000+ template reviews and ratings

## Story Sizing Justification (8 Points)

This is a **medium-high complexity** story requiring:
- Sophisticated search and discovery interface
- Rating and review system with community features
- Complex database queries for filtering and ranking
- Template usage tracking and analytics
- Advanced UI components for marketplace browsing
- Performance optimization for large-scale template catalogs
- Integration with existing template and user management systems
- Content curation and moderation capabilities

The 8-point estimate reflects the substantial frontend development effort and the need for scalable backend systems to support a full-featured template marketplace.

---

*This story creates a vibrant ecosystem for template sharing and discovery, enabling the community to contribute and benefit from collective development knowledge.*