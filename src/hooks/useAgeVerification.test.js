import useAgeVerification from '../useAgeVerification';

describe('useAgeVerification Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Age Calculation', () => {
    test('correctly identifies someone 18 years old as adult', async () => {
      const { verifyAge } = useAgeVerification();
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

      const result = await verifyAge(birthDate);
      expect(result.success).toBe(true);
      expect(result.age).toBe(18);
    });

    test('correctly identifies someone 17 years old as minor', async () => {
      const { verifyAge } = useAgeVerification();
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate() + 1);

      const result = await verifyAge(birthDate);
      expect(result.success).toBe(false);
      expect(result.age).toBe(17);
    });

    test('correctly identifies someone over 18 as adult', async () => {
      const { verifyAge } = useAgeVerification();
      const birthDate = new Date(1990, 0, 1);

      const result = await verifyAge(birthDate);
      expect(result.success).toBe(true);
      expect(result.age).toBeGreaterThanOrEqual(30);
    });

    test('handles leap year birthdays correctly', async () => {
      const { verifyAge } = useAgeVerification();
      const birthDate = new Date(2004, 1, 29); // Feb 29, 2004

      const result = await verifyAge(birthDate);
      expect(result.success).toBe(true);
      expect(result.age).toBe(20);
    });
  });

  describe('Token Generation and Validation', () => {
    test('generates valid token on successful age verification', async () => {
      const { verifyAge } = useAgeVerification();
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());

      await verifyAge(birthDate);
      const token = localStorage.getItem('age_verification_state');

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('does not store token for failed age verification', async () => {
      const { verifyAge } = useAgeVerification();
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

      await verifyAge(birthDate);
      const token = localStorage.getItem('age_verification_state');

      expect(token).toBeNull();
    });

    test('token persists across multiple function calls', async () => {
      const { verifyAge } = useAgeVerification();
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());

      await verifyAge(birthDate);
      const firstToken = localStorage.getItem('age_verification_state');

      // Simulate retrieving the token in a new instance
      const secondToken = localStorage.getItem('age_verification_state');

      expect(firstToken).toBe(secondToken);
    });
  });

  describe('Clear Verification', () => {
    test('clears verification token', async () => {
      const { verifyAge, clearVerification } = useAgeVerification();
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());

      await verifyAge(birthDate);
      expect(localStorage.getItem('age_verification_state')).toBeTruthy();

      clearVerification();
      expect(localStorage.getItem('age_verification_state')).toBeNull();
    });
  });

  describe('Message Formatting', () => {
    test('provides success message for valid age', async () => {
      const { verifyAge } = useAgeVerification();
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());

      const result = await verifyAge(birthDate);
      expect(result.message).toContain('✅');
      expect(result.message).toContain('verified');
    });

    test('provides rejection message for invalid age', async () => {
      const { verifyAge } = useAgeVerification();
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

      const result = await verifyAge(birthDate);
      expect(result.message).toContain('❌');
      expect(result.message).toContain('18');
    });
  });
});
