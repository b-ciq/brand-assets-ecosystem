#!/usr/bin/env node
/**
 * POST-CLEANUP TEST: Web-GUI App Functionality  
 * Created: 2025-09-08 (cleanup testing)
 * MARK FOR DELETION: After testing complete
 *
 * Tests web-GUI functionality after cleanup to ensure no breakage.
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// Test configuration
const TEST_PORT = 3001; // Use different port to avoid conflicts
const SEARCH_API_ENDPOINT = `http://localhost:${TEST_PORT}/api/search`;
const TEST_TIMEOUT = 30000;

class WebAppTester {
    constructor() {
        this.results = [];
        this.serverProcess = null;
    }

    log(message) {
        console.log(`  ${message}`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async startTestServer() {
        console.log('🚀 Starting test web server...');
        
        return new Promise((resolve, reject) => {
            // Start Next.js dev server on test port
            this.serverProcess = spawn('npm', ['run', 'dev', '--', '--port', TEST_PORT.toString()], {
                cwd: '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/interfaces/web-gui',
                stdio: 'pipe'
            });

            let started = false;
            const timeout = setTimeout(() => {
                if (!started) {
                    reject(new Error('Server startup timeout'));
                }
            }, TEST_TIMEOUT);

            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Ready') || output.includes(`localhost:${TEST_PORT}`)) {
                    if (!started) {
                        started = true;
                        clearTimeout(timeout);
                        this.log('✅ Test server started successfully');
                        resolve();
                    }
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (error.includes('Error') && !started) {
                    clearTimeout(timeout);
                    reject(new Error(`Server startup failed: ${error}`));
                }
            });

            this.serverProcess.on('error', (err) => {
                if (!started) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });
        });
    }

    async testSearchAPI() {
        console.log('🧪 Testing Search API endpoints...');
        
        const testCases = [
            { query: 'fuzzball', description: 'Primary fuzzball search' },
            { query: 'fuzz', description: 'Pattern matching: fuzz -> fuzzball' },
            { query: 'war', description: 'Pattern matching: war -> warewulf' },
            { query: 'ciq', description: 'CIQ company logo search' },
            { query: 'nonexistent', description: 'Nonexistent asset handling' }
        ];

        for (const testCase of testCases) {
            try {
                const response = await this.makeRequest(`${SEARCH_API_ENDPOINT}?query=${testCase.query}`);
                
                if (response.status === 200) {
                    const data = JSON.parse(response.body);
                    const assetCount = data.assets ? data.assets.length : 0;
                    this.results.push(`✅ PASS ${testCase.query.padEnd(12)} | ${testCase.description} | Found ${assetCount} assets`);
                    this.log(`✅ PASS ${testCase.query}: Found ${assetCount} assets`);
                } else {
                    this.results.push(`❌ FAIL ${testCase.query.padEnd(12)} | ${testCase.description} | HTTP ${response.status}`);
                    this.log(`❌ FAIL ${testCase.query}: HTTP ${response.status}`);
                }
            } catch (error) {
                this.results.push(`❌ FAIL ${testCase.query.padEnd(12)} | ${testCase.description} | Exception: ${error.message}`);
                this.log(`❌ FAIL ${testCase.query}: ${error.message}`);
            }
        }
    }

    async testComponentImports() {
        console.log('🧪 Testing component imports after cleanup...');
        
        const criticalFiles = [
            'src/components/DownloadModalNew.tsx', // Should exist (active)
            'src/components/AssetCard.tsx',        // Should import DownloadModalNew
            'src/components/Header.tsx',
            'src/components/AssetGrid.tsx'
        ];

        for (const file of criticalFiles) {
            try {
                const filePath = `/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/interfaces/web-gui/${file}`;
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check for removed component references
                    if (content.includes('DownloadModal') && !content.includes('DownloadModalNew')) {
                        this.results.push(`⚠️ WARN ${file.padEnd(35)} | Contains DownloadModal reference (should be DownloadModalNew)`);
                        this.log(`⚠️ WARN ${file}: Contains old DownloadModal reference`);
                    } else {
                        this.results.push(`✅ PASS ${file.padEnd(35)} | Component imports look correct`);
                        this.log(`✅ PASS ${file}: Component imports correct`);
                    }
                } else {
                    this.results.push(`❌ FAIL ${file.padEnd(35)} | File missing after cleanup`);
                    this.log(`❌ FAIL ${file}: File missing`);
                }
            } catch (error) {
                this.results.push(`❌ FAIL ${file.padEnd(35)} | Error reading file: ${error.message}`);
                this.log(`❌ FAIL ${file}: ${error.message}`);
            }
        }
    }

    async makeRequest(url) {
        return new Promise((resolve, reject) => {
            const request = http.get(url, (response) => {
                let body = '';
                response.on('data', chunk => body += chunk);
                response.on('end', () => {
                    resolve({
                        status: response.statusCode,
                        headers: response.headers,
                        body: body
                    });
                });
            });

            request.on('error', reject);
            request.setTimeout(10000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    async stopTestServer() {
        if (this.serverProcess) {
            console.log('🛑 Stopping test server...');
            this.serverProcess.kill('SIGTERM');
            await this.delay(2000);
            if (!this.serverProcess.killed) {
                this.serverProcess.kill('SIGKILL');
            }
        }
    }

    async runTests() {
        console.log('🚀 POST-CLEANUP WEB-GUI TESTING');
        console.log('='.repeat(50));

        try {
            // Test 1: Component Imports (no server needed)
            await this.testComponentImports();
            
            // Test 2: Start server and test APIs
            await this.startTestServer();
            await this.delay(3000); // Give server time to fully start
            
            await this.testSearchAPI();
            
        } catch (error) {
            this.results.push(`❌ FAIL CRITICAL | Server startup failed | ${error.message}`);
            console.log(`❌ CRITICAL FAILURE: ${error.message}`);
        } finally {
            await this.stopTestServer();
        }

        // Results summary
        console.log('\n' + '='.repeat(50));
        console.log('📋 WEB-GUI TEST RESULTS SUMMARY:');
        this.results.forEach(result => console.log(`  ${result}`));

        const passed = this.results.filter(r => r.startsWith('✅')).length;
        const failed = this.results.filter(r => r.startsWith('❌')).length;
        const warned = this.results.filter(r => r.startsWith('⚠️')).length;

        console.log(`\n🎯 WEB-GUI TESTS: ${passed} passed, ${failed} failed, ${warned} warnings`);
        
        return failed === 0;
    }
}

// Run tests
if (require.main === module) {
    const tester = new WebAppTester();
    tester.runTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test runner error:', error);
            process.exit(1);
        });
}