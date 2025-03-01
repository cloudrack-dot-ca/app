import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { log } from './vite';
import * as fs from 'fs';
import * as path from 'path';

// Function to test SSH connection with a server
export async function testSSHConnection(
  host: string,
  username: string = 'root',
  password: string | null = null,
  privateKeyPath: string | null = null
): Promise<string> {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();
    
    // Configure connection
    const config: ConnectConfig = {
      host,
      port: 22,
      username,
      readyTimeout: 10000,
      tryKeyboard: true,
      debug: (message: string) => log(`SSH Debug: ${message}`, 'test-ssh'),
    };
    
    // Add authentication methods
    if (password) {
      config.password = password;
      log(`Using password authentication`, 'test-ssh');
    }
    
    if (privateKeyPath && fs.existsSync(privateKeyPath)) {
      config.privateKey = fs.readFileSync(privateKeyPath);
      log(`Using private key authentication from ${privateKeyPath}`, 'test-ssh');
    }
    
    if (!password && !privateKeyPath) {
      reject('No authentication method provided');
      return;
    }
    
    // Set up event handlers
    sshClient.on('ready', () => {
      log(`Connection successful to ${host}`, 'test-ssh');
      
      // Try to execute a simple command
      sshClient.exec('whoami', (err, stream) => {
        if (err) {
          sshClient.end();
          reject(`Command execution failed: ${err.message}`);
          return;
        }
        
        let output = '';
        
        stream.on('data', (data: Buffer) => {
          output += data.toString('utf8');
        });
        
        stream.stderr.on('data', (data: Buffer) => {
          log(`STDERR: ${data.toString('utf8')}`, 'test-ssh');
        });
        
        stream.on('close', () => {
          sshClient.end();
          resolve(`Authentication successful. Command output: ${output.trim()}`);
        });
      });
    });
    
    sshClient.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
      log(`Keyboard-interactive auth initiated: ${JSON.stringify(prompts)}`, 'test-ssh');
      
      if (prompts.length > 0 && password) {
        log(`Responding to keyboard-interactive with password`, 'test-ssh');
        finish([password]);
      } else {
        log(`No password available for keyboard-interactive auth`, 'test-ssh');
        finish([]);
      }
    });
    
    sshClient.on('error', (err) => {
      log(`SSH error: ${err.message}`, 'test-ssh');
      reject(`Connection failed: ${err.message}`);
    });
    
    // Connect to the server
    log(`Connecting to ${host} as ${username}...`, 'test-ssh');
    sshClient.connect(config);
  });
}

// Export a function to run the test with command line arguments
export function runSSHTest() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node test-ssh.js <host> [username] [password] [private-key-path]');
    return;
  }
  
  const host = args[0];
  const username = args[1] || 'root';
  const password = args[2] || null;
  const privateKeyPath = args[3] || null;
  
  console.log(`Testing SSH connection to ${host} as ${username}`);
  console.log(`Password: ${password ? '****' : 'Not provided'}`);
  console.log(`Private key: ${privateKeyPath || 'Not provided'}`);
  
  testSSHConnection(host, username, password, privateKeyPath)
    .then(result => {
      console.log('SUCCESS:', result);
    })
    .catch(error => {
      console.error('FAILED:', error);
    });
}

// If this file is executed directly, run the test
if (require.main === module) {
  runSSHTest();
}