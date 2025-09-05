#!/usr/bin/env tsx

/**
 * Performance Monitor Script
 * 
 * Script para monitorear las métricas de performance del chatbot en tiempo real
 */

import { performanceMonitor } from '../server/chatbot/performance-monitor';
import { agentEngine } from '../server/chatbot/agent-decision-engine';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function printStats() {
  const stats = performanceMonitor.getAggregatedStats();
  const agentStats = agentEngine.getStats();
  
  console.clear();
  console.log('📊 Formmy Agent Performance Dashboard\n');
  console.log('═'.repeat(60));
  
  // Request Statistics
  console.log('\n🚀 Request Statistics (Last Hour)');
  console.log(`   Total Requests: ${stats.totalRequests}`);
  console.log(`   Avg Response Time: ${formatDuration(stats.avgResponseTime)}`);
  console.log(`   Error Rate: ${formatPercentage(stats.errorRate)}`);
  
  // Agent Performance
  console.log('\n🤖 Agent Decision Performance');
  console.log(`   Avg Decision Time: ${formatDuration(stats.avgAgentDecisionTime)}`);
  console.log(`   Cache Hit Rate: ${formatPercentage(stats.cacheEfficiency)}`);
  console.log(`   Cache Size: ${agentStats.cacheSize} entries`);
  
  // Tool Usage
  console.log('\n🛠️ Tool Usage Optimization');
  console.log(`   Tool Usage Rate: ${formatPercentage(stats.toolUsageRate)}`);
  console.log(`   Streaming Rate: ${formatPercentage(stats.streamingRate)}`);
  console.log(`   Fallback Rate: ${formatPercentage(stats.fallbackRate)}`);
  
  // Model Performance  
  console.log('\n📈 Model Performance');
  if (stats.topModelsUsed.length > 0) {
    stats.topModelsUsed.forEach((model, index) => {
      const percentage = stats.totalRequests > 0 ? 
        (model.count / stats.totalRequests * 100).toFixed(1) : '0.0';
      console.log(`   ${index + 1}. ${model.model}: ${model.count} (${percentage}%)`);
    });
  } else {
    console.log('   No data available');
  }
  
  // Provider Distribution
  console.log('\n🔌 Provider Distribution');
  if (stats.topProviders.length > 0) {
    stats.topProviders.forEach((provider, index) => {
      const percentage = stats.totalRequests > 0 ? 
        (provider.count / stats.totalRequests * 100).toFixed(1) : '0.0';
      console.log(`   ${index + 1}. ${provider.provider}: ${provider.count} (${percentage}%)`);
    });
  } else {
    console.log('   No data available');
  }
  
  // Performance Analysis
  console.log('\n📊 Performance Analysis');
  const performanceWarnings = [];
  
  if (stats.avgAgentDecisionTime > 50) {
    performanceWarnings.push(`⚠️  Slow agent decisions (${formatDuration(stats.avgAgentDecisionTime)})`);
  }
  
  if (stats.toolUsageRate > 0.4) {
    performanceWarnings.push(`⚠️  High tool usage rate (${formatPercentage(stats.toolUsageRate)})`);
  }
  
  if (stats.streamingRate < 0.6) {
    performanceWarnings.push(`⚠️  Low streaming rate (${formatPercentage(stats.streamingRate)})`);
  }
  
  if (stats.errorRate > 0.05) {
    performanceWarnings.push(`❌ High error rate (${formatPercentage(stats.errorRate)})`);
  }
  
  if (performanceWarnings.length > 0) {
    performanceWarnings.forEach(warning => console.log(`   ${warning}`));
  } else {
    console.log('   ✅ All metrics within optimal ranges');
  }
  
  // Optimization Suggestions
  console.log('\n💡 Optimization Suggestions');
  const suggestions = [];
  
  if (stats.cacheEfficiency < 0.3) {
    suggestions.push('Consider increasing cache TTL for better efficiency');
  }
  
  if (stats.avgAgentDecisionTime > 20) {
    suggestions.push('Optimize agent decision logic for faster processing');
  }
  
  if (stats.streamingRate < 0.7 && stats.toolUsageRate < 0.3) {
    suggestions.push('Review streaming disable logic - may be too aggressive');
  }
  
  if (stats.fallbackRate > 0.15) {
    suggestions.push('Check primary model availability and API keys');
  }
  
  if (suggestions.length > 0) {
    suggestions.forEach(suggestion => console.log(`   💡 ${suggestion}`));
  } else {
    console.log('   🎉 System is optimally configured');
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
  console.log('Press Ctrl+C to exit');
}

// Monitoring loop
console.log('🚀 Starting Formmy Performance Monitor...');
console.log('Monitoring chatbot performance metrics in real-time\n');

// Print stats immediately, then every 10 seconds
printStats();
const interval = setInterval(printStats, 10000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Performance monitor stopped');
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Performance monitor terminated');
  clearInterval(interval);
  process.exit(0);
});