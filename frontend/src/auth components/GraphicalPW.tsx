export interface UserCredentials {
  id: string;
  lovedOneImg: string;
  animalId: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

export const ANIMAL_POOL = [
  { id: 'a1', url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=150&auto=format&fit=crop&q=60', name: 'Lion' },
  { id: 'a2', url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=150&auto=format&fit=crop&q=60', name: 'Cat' },
  { id: 'a3', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=60', name: 'Dog' },
  { id: 'a4', url: 'https://images.unsplash.com/photo-15076664km-c511a5699745?w=150&auto=format&fit=crop&q=60', name: 'Panda' },
  { id: 'a5', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=60', name: 'Koala' },
  { id: 'a6', url: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=150&auto=format&fit=crop&q=60', name: 'Owl' },
];

export const DISTRACTOR_FACES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=60',
];

class GraphicalPassword {
  // Simulating a backend database/local registry lookup
  private static registeredUsers: Map<string, UserCredentials> = new Map();

  /**
   * Registers a user's graphical password configuration.
   */
  public static registerUser(credentials: UserCredentials): AuthResult {
    const trimmedId = credentials.id.trim();

    if (!trimmedId || !credentials.lovedOneImg || !credentials.animalId) {
      return {
        success: false,
        message: 'Please complete all steps: Enter ID, upload image, and select an animal.',
      };
    }

    this.registeredUsers.set(trimmedId, {
      ...credentials,
      id: trimmedId,
    });

    return {
      success: true,
      message: 'Signup successful! Switch to Login mode to verify.',
    };
  }

  /**
   * Retrieves a registered user's credentials.
   */
  public static getRegisteredUser(userId: string): UserCredentials | undefined {
    return this.registeredUsers.get(userId.trim());
  }

  /**
   * Dynamically constructs the challenge face lineup for a specific user ID.
   */
  public static getVerificationGridFaces(userId: string): string[] {
    const user = this.getRegisteredUser(userId);
    return user ? [...DISTRACTOR_FACES, user.lovedOneImg] : DISTRACTOR_FACES;
  }

  /**
   * Validates if the user's input matches their registered graphical credentials.
   */
  public static verifyPassword(
    userId: string,
    inputFace: string | undefined,
    inputAnimal: string | undefined
  ): AuthResult {
    const trimmedId = userId.trim();

    if (!trimmedId) {
      return { success: false, message: 'Please enter your user ID.' };
    }

    const user = this.getRegisteredUser(trimmedId);

    if (!user) {
      return { success: false, message: 'User ID not found.' };
    }

    if (!inputFace || !inputAnimal) {
      return { success: false, message: 'Please select both correct images.' };
    }

    const isFaceCorrect = inputFace === user.lovedOneImg;
    const isAnimalCorrect = inputAnimal === user.animalId;

    if (isFaceCorrect && isAnimalCorrect) {
      return { success: true, message: 'Authenticated successfully! Welcome back.' };
    }

    return { success: false, message: 'Authentication failed. Incorrect selections.' };
  }
}

export default GraphicalPassword;