/**
 * Log Search Service
 * Provides advanced search and indexing capabilities for logs
 */

const { getLogStorage } = require('./log-storage');
const { EventEmitter } = require('events');

class LogSearch extends EventEmitter {
  constructor() {
    super();
    this.logStorage = null;
    this.searchIndex = new Map(); // containerName -> index
    this.indexUpdateInterval = 60000; // 1 minute
    this.indexTimer = null;
    this.searchCache = new Map(); // cacheKey -> results
    this.cacheMaxAge = 300000; // 5 minutes
    this.cacheMaxSize = 100; // max cached searches
  }

  /**
   * Initialize the search service
   */
  async initialize() {
    try {
      // Get storage instance
      this.logStorage = getLogStorage();
      
      // Initialize storage if needed
      if (!this.logStorage.baseDir) {
        await this.logStorage.initialize();
      }
      
      // Build initial index
      await this.buildIndex();
      
      // Start periodic index updates
      this.startIndexUpdates();
      
      console.log('[LogSearch] Initialized log search service');
      return true;
    } catch (error) {
      console.error('[LogSearch] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Build search index for all containers
   */
  async buildIndex() {
    try {
      const stats = await this.logStorage.getStats();
      const containers = Object.keys(stats.containers);
      
      for (const containerName of containers) {
        await this.indexContainer(containerName);
      }
      
      console.log(`[LogSearch] Indexed ${containers.length} containers`);
    } catch (error) {
      console.error('[LogSearch] Index build error:', error);
    }
  }

  /**
   * Index logs for a specific container
   */
  async indexContainer(containerName) {
    try {
      const index = {
        containerName,
        lastIndexed: Date.now(),
        totalLogs: 0,
        levels: new Map(), // level -> count
        keywords: new Map(), // keyword -> Set of log indices
        timestamps: [], // sorted array of timestamps
        errorPatterns: new Map(), // error pattern -> count
        performanceMetrics: new Map() // metric type -> values
      };
      
      // Read all logs for the container
      const logs = await this.logStorage.read(containerName, { limit: 10000 });
      
      index.totalLogs = logs.length;
      
      // Process each log
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        
        // Index by level
        const levelCount = index.levels.get(log.level) || 0;
        index.levels.set(log.level, levelCount + 1);
        
        // Index timestamps
        index.timestamps.push(log.timestamp);
        
        // Extract and index keywords
        const keywords = this.extractKeywords(log.message);
        for (const keyword of keywords) {
          if (!index.keywords.has(keyword)) {
            index.keywords.set(keyword, new Set());
          }
          index.keywords.get(keyword).add(i);
        }
        
        // Index error patterns
        if (log.level === 'error') {
          const pattern = this.extractErrorPattern(log.message);
          if (pattern) {
            const count = index.errorPatterns.get(pattern) || 0;
            index.errorPatterns.set(pattern, count + 1);
          }
        }
        
        // Extract performance metrics
        const metrics = this.extractPerformanceMetrics(log.message);
        for (const [metricType, value] of metrics) {
          if (!index.performanceMetrics.has(metricType)) {
            index.performanceMetrics.set(metricType, []);
          }
          index.performanceMetrics.get(metricType).push({
            value,
            timestamp: log.timestamp
          });
        }
      }
      
      // Sort timestamps for efficient range queries
      index.timestamps.sort((a, b) => a - b);
      
      // Store index
      this.searchIndex.set(containerName, index);
      
      return index;
    } catch (error) {
      console.error(`[LogSearch] Error indexing container ${containerName}:`, error);
      throw error;
    }
  }

  /**
   * Extract keywords from log message
   */
  extractKeywords(message) {
    const keywords = new Set();
    
    // Split by whitespace and punctuation
    const words = message.toLowerCase().split(/[\s,;:.!?()[\]{}'"]+/);
    
    for (const word of words) {
      // Skip short words and numbers
      if (word.length > 2 && isNaN(word)) {
        keywords.add(word);
      }
      
      // Extract special patterns
      // IP addresses
      const ipMatch = message.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
      if (ipMatch) {
        ipMatch.forEach(ip => keywords.add(ip));
      }
      
      // URLs
      const urlMatch = message.match(/https?:\/\/[^\s]+/g);
      if (urlMatch) {
        urlMatch.forEach(url => keywords.add(url.toLowerCase()));
      }
      
      // Error codes
      const errorCodeMatch = message.match(/\b[A-Z]+_[A-Z_]+\b/g);
      if (errorCodeMatch) {
        errorCodeMatch.forEach(code => keywords.add(code.toLowerCase()));
      }
    }
    
    return keywords;
  }

  /**
   * Extract error pattern from message
   */
  extractErrorPattern(message) {
    // Common error patterns
    const patterns = [
      /Error: (.+?)(?:\n|$)/i,
      /Exception: (.+?)(?:\n|$)/i,
      /Failed to (.+?)(?:\n|$)/i,
      /Cannot (.+?)(?:\n|$)/i,
      /Unable to (.+?)(?:\n|$)/i,
      /Timeout (.+?)(?:\n|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        // Normalize the error pattern
        return match[0].toLowerCase()
          .replace(/\d+/g, 'N') // Replace numbers with N
          .replace(/['"](.*?)['"]/g, 'STR') // Replace strings with STR
          .substring(0, 100); // Limit length
      }
    }
    
    return null;
  }

  /**
   * Extract performance metrics from message
   */
  extractPerformanceMetrics(message) {
    const metrics = new Map();
    
    // Response time patterns
    const responseTimeMatch = message.match(/(?:response time|latency|duration)[:\s]+(\d+(?:\.\d+)?)\s*(ms|s|seconds?)/i);
    if (responseTimeMatch) {
      let value = parseFloat(responseTimeMatch[1]);
      if (responseTimeMatch[2].startsWith('s')) {
        value *= 1000; // Convert to ms
      }
      metrics.set('response_time', value);
    }
    
    // Memory usage patterns
    const memoryMatch = message.match(/(?:memory|mem)[:\s]+(\d+(?:\.\d+)?)\s*(MB|GB|KB)/i);
    if (memoryMatch) {
      let value = parseFloat(memoryMatch[1]);
      if (memoryMatch[2] === 'GB') value *= 1024;
      if (memoryMatch[2] === 'KB') value /= 1024;
      metrics.set('memory_usage', value);
    }
    
    // CPU usage patterns
    const cpuMatch = message.match(/(?:cpu)[:\s]+(\d+(?:\.\d+)?)\s*%/i);
    if (cpuMatch) {
      metrics.set('cpu_usage', parseFloat(cpuMatch[1]));
    }
    
    // Request count patterns
    const requestMatch = message.match(/(?:requests?|queries)[:\s]+(\d+)/i);
    if (requestMatch) {
      metrics.set('request_count', parseInt(requestMatch[1]));
    }
    
    return metrics;
  }

  /**
   * Search logs with advanced query capabilities
   */
  async search(query, options = {}) {
    try {
      // Check cache
      const cacheKey = this.getCacheKey(query, options);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      const results = {
        query,
        options,
        matches: [],
        totalMatches: 0,
        searchTime: Date.now(),
        facets: {}
      };
      
      // Parse query
      const parsedQuery = this.parseQuery(query);
      
      // Determine which containers to search
      const containers = options.containers || Array.from(this.searchIndex.keys());
      
      // Search each container
      for (const containerName of containers) {
        const containerResults = await this.searchContainer(
          containerName,
          parsedQuery,
          options
        );
        
        if (containerResults.logs.length > 0) {
          results.matches.push({
            containerName,
            count: containerResults.logs.length,
            logs: containerResults.logs
          });
          results.totalMatches += containerResults.logs.length;
        }
      }
      
      // Generate facets if requested
      if (options.includeFacets) {
        results.facets = this.generateFacets(results.matches);
      }
      
      // Calculate search time
      results.searchTime = Date.now() - results.searchTime;
      
      // Cache results
      this.addToCache(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error('[LogSearch] Search error:', error);
      throw error;
    }
  }

  /**
   * Parse search query
   */
  parseQuery(query) {
    const parsed = {
      text: '',
      filters: {},
      exclude: [],
      regex: null
    };
    
    // Check if it's a regex query
    if (query.startsWith('/') && query.endsWith('/')) {
      parsed.regex = new RegExp(query.slice(1, -1), 'i');
      return parsed;
    }
    
    // Parse advanced query syntax
    // Examples: 
    // - level:error message
    // - container:api level:warn response
    // - -exclude +include "exact phrase"
    
    const parts = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    
    for (const part of parts) {
      if (part.includes(':')) {
        // Filter syntax
        const [key, value] = part.split(':', 2);
        parsed.filters[key] = value.replace(/"/g, '');
      } else if (part.startsWith('-')) {
        // Exclude term
        parsed.exclude.push(part.substring(1).replace(/"/g, ''));
      } else if (part.startsWith('+')) {
        // Required term (add to text)
        parsed.text += ' ' + part.substring(1).replace(/"/g, '');
      } else {
        // Regular search term
        parsed.text += ' ' + part.replace(/"/g, '');
      }
    }
    
    parsed.text = parsed.text.trim();
    
    return parsed;
  }

  /**
   * Search within a container
   */
  async searchContainer(containerName, parsedQuery, options) {
    const index = this.searchIndex.get(containerName);
    const results = { logs: [] };
    
    // If no index, fall back to storage search
    if (!index) {
      const logs = await this.logStorage.read(containerName, {
        search: parsedQuery.text || parsedQuery.regex?.source,
        level: parsedQuery.filters.level || options.level,
        stream: parsedQuery.filters.stream || options.stream,
        since: options.since,
        until: options.until,
        limit: options.limit || 100
      });
      
      results.logs = logs;
      return results;
    }
    
    // Use index for faster search
    const matchingIndices = new Set();
    
    // Search by keywords
    if (parsedQuery.text) {
      const searchTerms = parsedQuery.text.toLowerCase().split(/\s+/);
      
      for (const term of searchTerms) {
        if (index.keywords.has(term)) {
          for (const idx of index.keywords.get(term)) {
            matchingIndices.add(idx);
          }
        }
      }
    }
    
    // If no keyword matches and no filters, return empty
    if (matchingIndices.size === 0 && !parsedQuery.regex && 
        Object.keys(parsedQuery.filters).length === 0) {
      return results;
    }
    
    // Read full logs for detailed filtering
    const allLogs = await this.logStorage.read(containerName, {
      limit: 10000
    });
    
    // Apply filters
    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i];
      
      // Check index match (if using keyword search)
      if (parsedQuery.text && !matchingIndices.has(i)) {
        continue;
      }
      
      // Check regex
      if (parsedQuery.regex && !parsedQuery.regex.test(log.message)) {
        continue;
      }
      
      // Check filters
      if (parsedQuery.filters.level && log.level !== parsedQuery.filters.level) {
        continue;
      }
      
      if (parsedQuery.filters.stream && log.stream !== parsedQuery.filters.stream) {
        continue;
      }
      
      // Check exclude terms
      let excluded = false;
      for (const term of parsedQuery.exclude) {
        if (log.message.toLowerCase().includes(term.toLowerCase())) {
          excluded = true;
          break;
        }
      }
      if (excluded) continue;
      
      // Check time range
      if (options.since && log.timestamp < new Date(options.since).getTime()) {
        continue;
      }
      
      if (options.until && log.timestamp > new Date(options.until).getTime()) {
        continue;
      }
      
      // Add to results
      results.logs.push(log);
      
      // Check limit
      if (options.limit && results.logs.length >= options.limit) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Generate facets from search results
   */
  generateFacets(matches) {
    const facets = {
      containers: {},
      levels: {},
      timeRanges: {},
      topErrors: []
    };
    
    for (const match of matches) {
      // Container facet
      facets.containers[match.containerName] = match.count;
      
      // Level facets
      for (const log of match.logs) {
        facets.levels[log.level] = (facets.levels[log.level] || 0) + 1;
      }
    }
    
    // Time range facets
    const now = Date.now();
    const ranges = {
      'last_hour': now - 3600000,
      'last_24h': now - 86400000,
      'last_7d': now - 604800000
    };
    
    for (const [rangeName, startTime] of Object.entries(ranges)) {
      facets.timeRanges[rangeName] = 0;
      for (const match of matches) {
        for (const log of match.logs) {
          if (log.timestamp >= startTime) {
            facets.timeRanges[rangeName]++;
          }
        }
      }
    }
    
    // Top errors
    const errorCounts = new Map();
    for (const match of matches) {
      for (const log of match.logs) {
        if (log.level === 'error') {
          const pattern = this.extractErrorPattern(log.message);
          if (pattern) {
            errorCounts.set(pattern, (errorCounts.get(pattern) || 0) + 1);
          }
        }
      }
    }
    
    // Sort and limit top errors
    facets.topErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));
    
    return facets;
  }

  /**
   * Get aggregated statistics
   */
  async getAggregatedStats(containerName, options = {}) {
    const index = this.searchIndex.get(containerName);
    
    if (!index) {
      await this.indexContainer(containerName);
      return this.searchIndex.get(containerName);
    }
    
    const stats = {
      containerName,
      totalLogs: index.totalLogs,
      lastIndexed: index.lastIndexed,
      levels: Object.fromEntries(index.levels),
      topKeywords: [],
      errorPatterns: [],
      performanceMetrics: {}
    };
    
    // Top keywords
    const keywordCounts = Array.from(index.keywords.entries())
      .map(([keyword, indices]) => ({ keyword, count: indices.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    stats.topKeywords = keywordCounts;
    
    // Error patterns
    stats.errorPatterns = Array.from(index.errorPatterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Performance metrics aggregation
    for (const [metricType, values] of index.performanceMetrics) {
      const metricValues = values.map(v => v.value);
      stats.performanceMetrics[metricType] = {
        min: Math.min(...metricValues),
        max: Math.max(...metricValues),
        avg: metricValues.reduce((a, b) => a + b, 0) / metricValues.length,
        count: metricValues.length
      };
    }
    
    return stats;
  }

  /**
   * Start periodic index updates
   */
  startIndexUpdates() {
    this.indexTimer = setInterval(async () => {
      await this.updateIndices();
    }, this.indexUpdateInterval);
  }

  /**
   * Update indices for all containers
   */
  async updateIndices() {
    try {
      const stats = await this.logStorage.getStats();
      const containers = Object.keys(stats.containers);
      
      for (const containerName of containers) {
        const index = this.searchIndex.get(containerName);
        
        // Re-index if old or missing
        if (!index || Date.now() - index.lastIndexed > this.indexUpdateInterval) {
          await this.indexContainer(containerName);
        }
      }
    } catch (error) {
      console.error('[LogSearch] Index update error:', error);
    }
  }

  /**
   * Get cache key for search
   */
  getCacheKey(query, options) {
    return JSON.stringify({ query, options });
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    const cached = this.searchCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.data;
    }
    
    // Remove expired entry
    if (cached) {
      this.searchCache.delete(key);
    }
    
    return null;
  }

  /**
   * Add to cache
   */
  addToCache(key, data) {
    // Limit cache size
    if (this.searchCache.size >= this.cacheMaxSize) {
      // Remove oldest entry
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
    
    this.searchCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.searchCache.clear();
    console.log('[LogSearch] Cache cleared');
  }

  /**
   * Clear index for a container
   */
  clearIndex(containerName) {
    this.searchIndex.delete(containerName);
    console.log(`[LogSearch] Index cleared for ${containerName}`);
  }

  /**
   * Shutdown the search service
   */
  async shutdown() {
    if (this.indexTimer) {
      clearInterval(this.indexTimer);
      this.indexTimer = null;
    }
    
    this.searchCache.clear();
    this.searchIndex.clear();
    
    console.log('[LogSearch] Shutdown complete');
  }
}

// Create singleton instance
let logSearch = null;

function getLogSearch() {
  if (!logSearch) {
    logSearch = new LogSearch();
  }
  return logSearch;
}

module.exports = {
  LogSearch,
  getLogSearch
};