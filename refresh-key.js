#!/usr/bin/env node

/**
 * Refresh Key - Using Proton CLI
 * Updates account permission keys on Proton blockchain
 * 
 * @module refresh-key
 * @requires child_process
 * @requires util
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Update authentication permission for a Proton account
 * 
 * @async
 * @param {string} account - Proton account name
 * @param {string} newPublicKey - New public key in format PUB_K1_...
 * @param {string} [permission='active'] - Permission level: 'active' or 'owner'
 * @returns {Promise<Object>} Result object with success status and transaction details
 * @returns {boolean} return.success - Whether the operation succeeded
 * @returns {string} return.account - Account name
 * @returns {string} return.permission - Permission that was updated
 * @returns {string|null} return.transactionId - Transaction ID or null if not found
 * @returns {string|null} return.transactionLink - explorer link or null if no transaction ID
 * @returns {string} return.newPublicKey - The new public key
 * @returns {string} return.output - Raw output from Proton CLI (on success)
 * @returns {string} return.error - Error message (on failure)
 * @returns {string} return.stderr - Stderr output (on failure)
 * 
 * @example
 * const result = await updateAuth('dcdoit', 'PUB_K1_...', 'active');
 * if (result.success) {
 *   console.log('Transaction ID:', result.transactionId);
 * }
 */
async function updateAuth(account, newPublicKey, permission = 'active') {
  try {
    console.log(`[INFO] Updating auth for ${account}@${permission}...`);
    console.log(`[INFO] New public key: ${newPublicKey}`);

    // Build updateauth payload
    const parent = permission === 'owner' ? '' : 'owner';

    const actionData = {
      account: account,
      permission: permission,
      parent: parent,
      auth: {
        threshold: 1,
        keys: [{
          key: newPublicKey,
          weight: 1
        }],
        accounts: [],
        waits: []
      }
    };

    // Execute updateauth using proton action
    console.log('[INFO] Executing updateauth transaction...');
    
    const dataJson = JSON.stringify(actionData);
    const authorization = `${account}@${permission === 'owner' ? 'owner' : 'active'}`;
    
    const cmd = `proton action eosio updateauth '${dataJson}' ${authorization}`;
    
    console.log(`[DEBUG] Command: ${cmd}`);
    
    const { stdout, stderr } = await execAsync(cmd);
    
    if (stderr) {
      console.warn('[WARNING]', stderr);
    }
    
    console.log('[INFO] Output:', stdout);
    
    // Parse transaction ID
    const txMatch = stdout.match(/transaction[_\s]id[:\s]+([a-f0-9]+)/i) || 
                    stdout.match(/([a-f0-9]{64})/);
    const transactionId = txMatch ? txMatch[1] : null;

    // Return result
    return {
      success: true,
      account,
      permission,
      transactionId,
      transactionLink: transactionId ? `https://explorer.xprnetwork.org/transaction/${transactionId}` : null,
      newPublicKey,
      output: stdout
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr
    };
  }
}

/**
 * Main entry point
 * Parses command line arguments and executes updateAuth
 * 
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node refresh-key.js <account> <newPublicKey> [permission]');
    console.log('');
    console.log('Parameters:');
    console.log('  account       - Proton account name');
    console.log('  newPublicKey  - New public key to set (PUB_K1_...)');
    console.log('  permission    - Permission to update: active or owner (default: active)');
    console.log('');
    console.log('Note: Uses keys from "proton key:list" for signing');
    console.log('      Make sure you have the required key imported');
    console.log('');
    console.log('Example:');
    console.log('  node refresh-key.js dcdoit PUB_K1_6aEZ3qzrzG4xniJXTm79RUQfKYmFGsH2UfgbvMVBAeNZJJYTsu active');
    console.log('');
    process.exit(1);
  }

  const account = args[0];
  const newPublicKey = args[1];
  const permission = args[2] || 'active';

  console.log('');
  console.log('='.repeat(50));
  console.log('  XPR Key Refresh');
  console.log('='.repeat(50));
  console.log('');

  const result = await updateAuth(account, newPublicKey, permission);

  console.log('');
  console.log('='.repeat(50));
  
  if (result.success) {
    console.log('  SUCCESS');
    console.log('='.repeat(50));
    console.log('');
    console.log(`Account: ${result.account}@${result.permission}`);
    console.log(`New Public Key: ${result.newPublicKey}`);
    
    if (result.transactionId) {
      console.log(`Transaction ID: ${result.transactionId}`);
      console.log(`Transaction Link: ${result.transactionLink}`);
    }
    console.log('');
    
    // Output JSON
    console.log('JSON Output:');
    console.log(JSON.stringify({
      success: true,
      account: result.account,
      permission: result.permission,
      transactionId: result.transactionId,
      transactionLink: result.transactionLink,
      newPublicKey: result.newPublicKey
    }, null, 2));
    console.log('');
    
  } else {
    console.log('  FAILED');
    console.log('='.repeat(50));
    console.log('');
    console.log(`Error: ${result.error}`);
    if (result.stderr) {
      console.log(`Details: ${result.stderr}`);
    }
    console.log('');
    process.exit(1);
  }
}

main();
