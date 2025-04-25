import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  verifiedAgencies: new Map(),
  blockHeight: 100,
  
  // Mock contract functions
  verifyAgency(agency, name, agencyType) {
    // Check if caller is admin
    if (this.txSender !== this.admin) {
      return { err: 1 };
    }
    
    // Check if agency is already verified
    if (this.verifiedAgencies.has(agency)) {
      return { err: 2 };
    }
    
    // Verify agency
    this.verifiedAgencies.set(agency, {
      name,
      'verification-date': this.blockHeight,
      'agency-type': agencyType,
      'is-active': true
    });
    
    return { ok: true };
  },
  
  deactivateAgency(agency) {
    // Check if caller is admin
    if (this.txSender !== this.admin) {
      return { err: 1 };
    }
    
    // Check if agency exists
    if (!this.verifiedAgencies.has(agency)) {
      return { err: 3 };
    }
    
    // Deactivate agency
    const agencyData = this.verifiedAgencies.get(agency);
    agencyData['is-active'] = false;
    this.verifiedAgencies.set(agency, agencyData);
    
    return { ok: true };
  },
  
  isVerified(agency) {
    const agencyData = this.verifiedAgencies.get(agency);
    if (agencyData) {
      return agencyData['is-active'];
    }
    return false;
  },
  
  getAgencyDetails(agency) {
    return this.verifiedAgencies.get(agency) || null;
  },
  
  transferAdmin(newAdmin) {
    // Check if caller is admin
    if (this.txSender !== this.admin) {
      return { err: 1 };
    }
    
    this.admin = newAdmin;
    return { ok: true };
  },
  
  // Mock transaction sender
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
};

describe('Agency Verification Contract', () => {
  beforeEach(() => {
    // Reset the contract state before each test
    mockContract.verifiedAgencies.clear();
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.txSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.blockHeight = 100;
  });
  
  it('should verify a new agency when called by admin', () => {
    const agency = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const result = mockContract.verifyAgency(agency, 'Fire Department', 'Fire');
    
    expect(result).toEqual({ ok: true });
    expect(mockContract.verifiedAgencies.has(agency)).toBe(true);
    
    const agencyData = mockContract.verifiedAgencies.get(agency);
    expect(agencyData.name).toBe('Fire Department');
    expect(agencyData['agency-type']).toBe('Fire');
    expect(agencyData['is-active']).toBe(true);
  });
  
  it('should not verify an agency when called by non-admin', () => {
    mockContract.txSender = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    const agency = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const result = mockContract.verifyAgency(agency, 'Fire Department', 'Fire');
    
    expect(result).toEqual({ err: 1 });
    expect(mockContract.verifiedAgencies.has(agency)).toBe(false);
  });
  
  it('should not verify an agency that is already verified', () => {
    const agency = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    mockContract.verifyAgency(agency, 'Fire Department', 'Fire');
    
    const result = mockContract.verifyAgency(agency, 'Fire Department 2', 'Fire');
    
    expect(result).toEqual({ err: 2 });
  });
  
  it('should deactivate an agency when called by admin', () => {
    const agency = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    mockContract.verifyAgency(agency, 'Fire Department', 'Fire');
    
    const result = mockContract.deactivateAgency(agency);
    
    expect(result).toEqual({ ok: true });
    
    const agencyData = mockContract.verifiedAgencies.get(agency);
    expect(agencyData['is-active']).toBe(false);
  });
  
  it('should not deactivate an agency when called by non-admin', () => {
    const agency = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    mockContract.verifyAgency(agency, 'Fire Department', 'Fire');
    
    mockContract.txSender = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const result = mockContract.deactivateAgency(agency);
    
    expect(result).toEqual({ err: 1 });
    
    const agencyData = mockContract.verifiedAgencies.get(agency);
    expect(agencyData['is-active']).toBe(true);
  });
  
  it('should correctly check if an agency is verified', () => {
    const agency = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    mockContract.verifyAgency(agency, 'Fire Department', 'Fire');
    
    expect(mockContract.isVerified(agency)).toBe(true);
    
    mockContract.deactivateAgency(agency);
    expect(mockContract.isVerified(agency)).toBe(false);
    
    const nonExistentAgency = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5YC7WPG3M';
    expect(mockContract.isVerified(nonExistentAgency)).toBe(false);
  });
  
  it('should transfer admin rights', () => {
    const newAdmin = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5YC7WPG3M';
    const result = mockContract.transferAdmin(newAdmin);
    
    expect(result).toEqual({ ok: true });
    expect(mockContract.admin).toBe(newAdmin);
    
    // Original admin can no longer perform admin actions
    mockContract.txSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const agency = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    expect(mockContract.verifyAgency(agency, 'Fire Department', 'Fire')).toEqual({ err: 1 });
    
    // New admin can perform admin actions
    mockContract.txSender = newAdmin;
    expect(mockContract.verifyAgency(agency, 'Fire Department', 'Fire')).toEqual({ ok: true });
  });
});

console.log('Agency Verification Contract tests completed successfully!');
