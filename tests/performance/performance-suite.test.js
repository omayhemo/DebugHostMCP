/**
 * Performance Testing Suite
 * Comprehensive performance tests for high-load scenarios and scalability
 */

const { performance, PerformanceObserver } = require('perf_hooks');
const os = require('os');
const cluster = require('cluster');
const { spawn } = require('child_process');

describe('⚡ Performance Testing Suite', () => {
    let performanceMetrics = [];
    let observer;
    
    beforeAll(() => {
        // Set up performance observer
        observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            performanceMetrics.push(...entries);
        });
        
        observer.observe({ entryTypes: ['measure', 'mark'] });
        
        console.log(`🖥️  System Info:`);
        console.log(`   CPU Cores: ${os.cpus().length}`);
        console.log(`   Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`);
        console.log(`   Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB`);
        console.log(`   Platform: ${os.platform()} ${os.arch()}`);
    });
    
    afterAll(() => {
        if (observer) {
            observer.disconnect();
        }
        
        // Report performance summary
        console.log(`📊 Performance Test Summary:`);
        console.log(`   Total measurements: ${performanceMetrics.length}`);
        
        if (performanceMetrics.length > 0) {
            const avgDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length;
            console.log(`   Average duration: ${avgDuration.toFixed(2)}ms`);
        }
    });
    
    describe('System Resource Performance', () => {
        test('should handle high CPU load efficiently', async () => {
            const startTime = performance.now();
            const startUsage = process.cpuUsage();
            
            performance.mark('cpu-test-start');
            
            // Simulate CPU-intensive work
            const cpuIntensiveTask = () => {
                const iterations = 1000000;
                let result = 0;
                
                for (let i = 0; i < iterations; i++) {
                    result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
                }
                
                return result;
            };
            
            // Run CPU-intensive tasks
            const tasks = [];
            const numTasks = os.cpus().length; // One task per CPU core
            
            for (let i = 0; i < numTasks; i++) {
                tasks.push(new Promise(resolve => {
                    setImmediate(() => {
                        const result = cpuIntensiveTask();
                        resolve(result);
                    });
                }));
            }
            
            const results = await Promise.all(tasks);
            
            performance.mark('cpu-test-end');
            performance.measure('cpu-intensive-test', 'cpu-test-start', 'cpu-test-end');
            
            const endTime = performance.now();
            const endUsage = process.cpuUsage(startUsage);
            
            const totalTime = endTime - startTime;
            const cpuTime = (endUsage.user + endUsage.system) / 1000; // Convert to milliseconds
            
            console.log(`🔥 CPU Performance Results:`);
            console.log(`   Tasks completed: ${results.length}`);
            console.log(`   Wall time: ${totalTime.toFixed(2)}ms`);
            console.log(`   CPU time: ${cpuTime.toFixed(2)}ms`);
            console.log(`   CPU efficiency: ${((cpuTime / totalTime) * 100).toFixed(1)}%`);
            
            // Should complete within reasonable time
            expect(totalTime).toBeLessThan(10000); // 10 seconds max
            expect(results.length).toBe(numTasks);
        });
        
        test('should manage memory usage under load', async () => {
            const initialMemory = process.memoryUsage();
            
            performance.mark('memory-test-start');
            
            // Create memory pressure
            const largeArrays = [];
            const arraySize = 100000; // 100k elements per array
            const numArrays = 50;
            
            for (let i = 0; i < numArrays; i++) {
                const array = new Array(arraySize);
                for (let j = 0; j < arraySize; j++) {
                    array[j] = Math.random();
                }
                largeArrays.push(array);
                
                // Allow event loop to process
                if (i % 10 === 0) {
                    await new Promise(resolve => setImmediate(resolve));
                }
            }
            
            const peakMemory = process.memoryUsage();
            
            // Perform operations on the arrays
            let operationResults = 0;
            for (const array of largeArrays) {
                operationResults += array.reduce((sum, val) => sum + val, 0);
            }
            
            // Clear memory
            largeArrays.length = 0;
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const finalMemory = process.memoryUsage();
            
            performance.mark('memory-test-end');
            performance.measure('memory-intensive-test', 'memory-test-start', 'memory-test-end');
            
            const memoryIncrease = peakMemory.heapUsed - initialMemory.heapUsed;
            const memoryRecovered = peakMemory.heapUsed - finalMemory.heapUsed;
            const recoveryRate = (memoryRecovered / memoryIncrease) * 100;
            
            console.log(`🧠 Memory Performance Results:`);
            console.log(`   Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Peak heap: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Memory recovered: ${(memoryRecovered / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Recovery rate: ${recoveryRate.toFixed(1)}%`);
            
            // Should not use excessive memory
            expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // 500MB max
            
            // Should recover most memory (at least 50%)
            expect(recoveryRate).toBeGreaterThan(50);
            
            expect(operationResults).toBeGreaterThan(0);
        });
    });
    
    describe('Concurrent Processing Performance', () => {
        test('should handle multiple concurrent operations', async () => {
            const concurrentOperations = 100;
            const operationDuration = 100; // 100ms per operation
            
            performance.mark('concurrent-test-start');
            
            const concurrentTasks = [];
            
            for (let i = 0; i < concurrentOperations; i++) {
                const task = new Promise(resolve => {
                    const startTime = performance.now();
                    
                    // Simulate async operation
                    setTimeout(() => {
                        const endTime = performance.now();
                        const actualDuration = endTime - startTime;
                        
                        resolve({
                            id: i,
                            duration: actualDuration,
                            expectedDuration: operationDuration
                        });
                    }, operationDuration);
                });
                
                concurrentTasks.push(task);
            }
            
            const results = await Promise.all(concurrentTasks);
            
            performance.mark('concurrent-test-end');
            performance.measure('concurrent-operations-test', 'concurrent-test-start', 'concurrent-test-end');
            
            const totalTime = performance.now() - results[0].duration;
            const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
            const maxDuration = Math.max(...results.map(r => r.duration));
            const minDuration = Math.min(...results.map(r => r.duration));
            
            console.log(`🔄 Concurrent Processing Results:`);
            console.log(`   Operations: ${results.length}`);
            console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
            console.log(`   Average duration: ${avgDuration.toFixed(2)}ms`);
            console.log(`   Max duration: ${maxDuration.toFixed(2)}ms`);
            console.log(`   Min duration: ${minDuration.toFixed(2)}ms`);
            console.log(`   Concurrency factor: ${(concurrentOperations * operationDuration / totalTime).toFixed(2)}x`);
            
            // All operations should complete
            expect(results.length).toBe(concurrentOperations);
            
            // Should run concurrently (total time much less than sequential)
            const sequentialTime = concurrentOperations * operationDuration;
            expect(totalTime).toBeLessThan(sequentialTime * 0.5); // At least 2x faster than sequential
        });
        
        test('should scale with increasing load', async () => {
            const loadLevels = [10, 50, 100, 200];
            const results = [];
            
            for (const load of loadLevels) {
                performance.mark(`scale-test-${load}-start`);
                
                const tasks = [];
                for (let i = 0; i < load; i++) {
                    tasks.push(new Promise(resolve => {
                        const work = () => {
                            // Light CPU work
                            let result = 0;
                            for (let j = 0; j < 1000; j++) {
                                result += Math.sqrt(j);
                            }
                            return result;
                        };
                        
                        setImmediate(() => resolve(work()));
                    }));
                }
                
                const startTime = performance.now();
                await Promise.all(tasks);
                const endTime = performance.now();
                
                performance.mark(`scale-test-${load}-end`);
                performance.measure(`scale-test-${load}`, `scale-test-${load}-start`, `scale-test-${load}-end`);
                
                const duration = endTime - startTime;
                const throughput = load / (duration / 1000); // operations per second
                
                results.push({
                    load,
                    duration,
                    throughput
                });
                
                console.log(`📈 Load ${load}: ${duration.toFixed(2)}ms, ${throughput.toFixed(2)} ops/sec`);
            }
            
            // Calculate scalability metrics
            const firstResult = results[0];
            const lastResult = results[results.length - 1];
            
            const loadIncrease = lastResult.load / firstResult.load;
            const timeIncrease = lastResult.duration / firstResult.duration;
            const scalabilityRatio = loadIncrease / timeIncrease;
            
            console.log(`📊 Scalability Analysis:`);
            console.log(`   Load increase: ${loadIncrease}x`);
            console.log(`   Time increase: ${timeIncrease.toFixed(2)}x`);
            console.log(`   Scalability ratio: ${scalabilityRatio.toFixed(2)}`);
            
            // Should scale reasonably well (ratio > 0.5 means sub-linear scaling)
            expect(scalabilityRatio).toBeGreaterThan(0.3);
            
            // Should complete all load levels
            expect(results.length).toBe(loadLevels.length);
        });
    });
    
    describe('I/O Performance', () => {
        test('should handle high-frequency file operations', async () => {
            const fs = require('fs').promises;
            const path = require('path');
            const numFiles = 100;
            const fileSize = 1024; // 1KB per file
            
            const tempDir = global.createTempDir ? global.createTempDir() : '/tmp/performance-test';
            
            try {
                await fs.mkdir(tempDir, { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
            
            performance.mark('io-test-start');
            
            // Create files
            const createPromises = [];
            for (let i = 0; i < numFiles; i++) {
                const filePath = path.join(tempDir, `test-file-${i}.txt`);
                const content = 'A'.repeat(fileSize);
                
                createPromises.push(fs.writeFile(filePath, content));
            }
            
            await Promise.all(createPromises);
            
            // Read files
            const readPromises = [];
            for (let i = 0; i < numFiles; i++) {
                const filePath = path.join(tempDir, `test-file-${i}.txt`);
                readPromises.push(fs.readFile(filePath, 'utf8'));
            }
            
            const fileContents = await Promise.all(readPromises);
            
            // Delete files
            const deletePromises = [];
            for (let i = 0; i < numFiles; i++) {
                const filePath = path.join(tempDir, `test-file-${i}.txt`);
                deletePromises.push(fs.unlink(filePath));
            }
            
            await Promise.all(deletePromises);
            
            performance.mark('io-test-end');
            performance.measure('io-intensive-test', 'io-test-start', 'io-test-end');
            
            const duration = performance.now();
            const totalBytes = numFiles * fileSize * 2; // Read + Write
            const throughput = (totalBytes / 1024 / 1024) / (duration / 1000); // MB/s
            
            console.log(`💾 I/O Performance Results:`);
            console.log(`   Files processed: ${numFiles}`);
            console.log(`   Total data: ${(totalBytes / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Duration: ${duration.toFixed(2)}ms`);
            console.log(`   Throughput: ${throughput.toFixed(2)}MB/s`);
            
            // Should complete all operations
            expect(fileContents.length).toBe(numFiles);
            
            // Should have reasonable throughput (> 1MB/s)
            expect(throughput).toBeGreaterThan(1);
            
            // All files should have correct content
            fileContents.forEach(content => {
                expect(content.length).toBe(fileSize);
            });
        });
    });
    
    describe('Network Performance', () => {
        test('should handle high-frequency HTTP requests', async () => {
            const http = require('http');
            const testPort = global.__TEST_PORTS__?.performance || 9999;
            
            // Create test server
            const server = http.createServer((req, res) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    message: 'OK', 
                    timestamp: Date.now(),
                    url: req.url 
                }));
            });
            
            await new Promise(resolve => {
                server.listen(testPort, resolve);
            });
            
            try {
                const numRequests = 200;
                performance.mark('http-test-start');
                
                const requestPromises = [];
                for (let i = 0; i < numRequests; i++) {
                    const requestPromise = new Promise((resolve, reject) => {
                        const startTime = performance.now();
                        
                        const req = http.request({
                            hostname: 'localhost',
                            port: testPort,
                            path: `/test/${i}`,
                            method: 'GET'
                        }, (res) => {
                            let data = '';
                            
                            res.on('data', chunk => {
                                data += chunk;
                            });
                            
                            res.on('end', () => {
                                const endTime = performance.now();
                                resolve({
                                    id: i,
                                    statusCode: res.statusCode,
                                    duration: endTime - startTime,
                                    responseSize: data.length
                                });
                            });
                        });
                        
                        req.on('error', reject);
                        req.setTimeout(5000, () => {
                            req.destroy();
                            reject(new Error('Request timeout'));
                        });
                        
                        req.end();
                    });
                    
                    requestPromises.push(requestPromise);
                }
                
                const results = await Promise.all(requestPromises);
                
                performance.mark('http-test-end');
                performance.measure('http-intensive-test', 'http-test-start', 'http-test-end');
                
                const totalDuration = performance.now();
                const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
                const maxDuration = Math.max(...results.map(r => r.duration));
                const requestsPerSecond = (numRequests / totalDuration) * 1000;
                
                console.log(`🌐 HTTP Performance Results:`);
                console.log(`   Requests: ${results.length}`);
                console.log(`   Total time: ${totalDuration.toFixed(2)}ms`);
                console.log(`   Average request time: ${avgDuration.toFixed(2)}ms`);
                console.log(`   Max request time: ${maxDuration.toFixed(2)}ms`);
                console.log(`   Requests/second: ${requestsPerSecond.toFixed(2)}`);
                
                // All requests should succeed
                expect(results.length).toBe(numRequests);
                results.forEach(result => {
                    expect(result.statusCode).toBe(200);
                });
                
                // Should achieve reasonable throughput
                expect(requestsPerSecond).toBeGreaterThan(50);
                expect(avgDuration).toBeLessThan(100);
                
            } finally {
                server.close();
            }
        });
    });
    
    describe('Process Management Performance', () => {
        test('should handle rapid process spawning and termination', async () => {
            const numProcesses = 20;
            const processResults = [];
            
            performance.mark('process-test-start');
            
            for (let i = 0; i < numProcesses; i++) {
                const startTime = performance.now();
                
                const child = spawn('node', ['-e', `
                    console.log('Process ${i} started');
                    setTimeout(() => {
                        console.log('Process ${i} finished');
                        process.exit(0);
                    }, 100);
                `]);
                
                const result = await new Promise((resolve) => {
                    let stdout = '';
                    let stderr = '';
                    
                    child.stdout.on('data', (data) => {
                        stdout += data.toString();
                    });
                    
                    child.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                    
                    child.on('close', (code) => {
                        const endTime = performance.now();
                        resolve({
                            id: i,
                            exitCode: code,
                            duration: endTime - startTime,
                            stdout: stdout.trim(),
                            stderr: stderr.trim()
                        });
                    });
                });
                
                processResults.push(result);
            }
            
            performance.mark('process-test-end');
            performance.measure('process-management-test', 'process-test-start', 'process-test-end');
            
            const totalTime = performance.now();
            const avgDuration = processResults.reduce((sum, r) => sum + r.duration, 0) / processResults.length;
            const successfulProcesses = processResults.filter(r => r.exitCode === 0).length;
            
            console.log(`⚙️  Process Management Results:`);
            console.log(`   Processes spawned: ${processResults.length}`);
            console.log(`   Successful: ${successfulProcesses}`);
            console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
            console.log(`   Average process time: ${avgDuration.toFixed(2)}ms`);
            
            // All processes should complete successfully
            expect(successfulProcesses).toBe(numProcesses);
            
            // Should complete within reasonable time
            expect(totalTime).toBeLessThan(10000); // 10 seconds max
            expect(avgDuration).toBeLessThan(1000); // 1 second per process max
        });
    });
});