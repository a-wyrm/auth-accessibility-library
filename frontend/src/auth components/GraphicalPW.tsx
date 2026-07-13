;

export interface UserCredentials {
  id: string;
  lovedOneImg: string;
  animalId: string;
  animalArray: {id: string; url: string; name: string;}[];
}

export interface AuthResult {
  success: boolean;
  message: string;
}

export interface GraphicalAnimalOption {
  id: string;
  url: string;
  name: string;
}

export interface GraphicalChallengeGrid {
  success: boolean;
  message: string;
  faceChallenges: string[];
  animalOptions: GraphicalAnimalOption[];
  animalArray: {id: string; url: string; name: string;}[];
}

export const DISTRACTOR_FACES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=60',
];


export const ANIMAL_POOL: Array<{ id: string; url: string; name: string }> = [];

export async function fillAnimalPool() {
  // 2x dog-database-free-api
  for (let i = 0; i < 2; i++) {
    const res = await fetch("https://dog.ceo/api/breeds/image/random");
    if (!res.ok) throw new Error(`Dog API call failed (attempt ${i + 1})`);

    const data = await res.json();
    console.log(data);
    const url =
      data?.message;

    if (!url) throw new Error("Could not find dog image url in response");
    ANIMAL_POOL.push({ id: `a${i + 1}`, url, name: "Dog" });
  }

  // 2x randomfox
  for (let i = 0; i < 2; i++) {
    const res = await fetch("https://randomfox.ca/floof/");
    if (!res.ok) throw new Error(`Fox API call failed (attempt ${i + 1})`);

    const data = await res.json();
    const url = data?.image;

    if (!url) throw new Error("Could not find fox image url in response");
    ANIMAL_POOL.push({ id: `a${i + 3}`, url, name: "Fox" });
  }

  // 2x random cat
  for (let i = 0; i < 2; i++) {
    const res = await fetch("https://aleatori.cat/random.json");
    if (!res.ok) throw new Error(`Fox API call failed (attempt ${i + 1})`);

    const data = await res.json();
    const url = data?.jpeg;

    if (!url) throw new Error("Could not find cat image url in response");
    ANIMAL_POOL.push({ id: `a${i + 5}`, url, name: "Cat" });
  }

  return ANIMAL_POOL;
}

fillAnimalPool();


type GraphicalEnrollmentPayload = {
  userId: string;
  lovedOneImgHash?: string;
  imageData?: string;
  animalId: string;
  animalArray: {id: string; url: string; name: string;}[];
};

type GraphicalLoginPayload = {
  userId: string;
  selectedFace: string;
  selectedAnimalId: string;
};

const API_BASE = '/api/auth/graphical';

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return (await response.json()) as TResponse;
}

class GraphicalPassword {
  /**
   * Loads the signup challenge data
   */
  public static async getEnrollmentGrid(userId: string): Promise<GraphicalChallengeGrid> {
    const trimmedId = userId.trim();

    const response = await fetch(`${API_BASE}/enroll/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: trimmedId }),
    });

    if (!response.ok) {
      const errorMessage = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      return {
        success: false,
        message: errorMessage?.message ?? 'Unable to load signup animals from the backend.',
        faceChallenges: [],
        animalOptions: [],
        animalArray: [{ id: "1", url: "https://example.com", name: "Example" }],
      };
    }

    const grid = (await response.json()) as GraphicalChallengeGrid;

    return {
      ...grid,
      success: true,
      message: '',
    };
  }

  /**
   * Registers a user's graphical password configuration on the backend.
   */
  public static async registerUser(credentials: UserCredentials): Promise<AuthResult> {
    const trimmedId = credentials.id.trim();

    if (!trimmedId || !credentials.lovedOneImg || !credentials.animalId) {
      return {
        success: false,
        message: 'Please complete all steps: Enter ID, upload image, and select an animal.',
      };
    }

    const payload: GraphicalEnrollmentPayload = {
      userId: trimmedId,
      lovedOneImgHash: credentials.lovedOneImg,
      imageData: credentials.lovedOneImg,
      animalId: credentials.animalId,
      animalArray: credentials.animalArray
    };

    const result = await postJson<AuthResult>(`${API_BASE}/enroll/finish`, payload);

    return result;
  }

  /**
   * Loads the login challenge for a specific user identifier.
   */
  public static async getVerificationGridFaces(userId: string): Promise<GraphicalChallengeGrid> {
    const trimmedId = userId.trim();

    if (!trimmedId) {
      return {
        success: false,
        message: 'Please enter a user ID to load the login challenge.',
        faceChallenges: [],
        animalOptions: [],
        animalArray: [],
      };
    }

    const response = await fetch(`${API_BASE}/login/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: trimmedId }),
    });

    if (!response.ok) {
      const errorMessage = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      return {
        success: false,
        message: errorMessage?.message ?? 'No graphical profile found for that user ID. Sign up first.',
        faceChallenges: [],
        animalOptions: [],
        animalArray: [],
      };
    }

    const grid = (await response.json()) as GraphicalChallengeGrid;

    return {
      ...grid,
      success: true,
      message: '',
    };
  }

  /**
   * Verifies the selected face and animal against the backend-stored credential.
   */
  public static async verifyPassword(
    userId: string,
    inputFace: string | undefined,
    inputAnimal: string | undefined
  ): Promise<AuthResult> {
    const trimmedId = userId.trim();

    if (!trimmedId) {
      return { success: false, message: 'Please enter your user ID.' };
    }

    if (!inputFace || !inputAnimal) {
      return { success: false, message: 'Please select both correct images.' };
    }

    const payload: GraphicalLoginPayload = {
      userId: trimmedId,
      selectedFace: inputFace,
      selectedAnimalId: inputAnimal,
    };

    return postJson<AuthResult>(`${API_BASE}/login/verify`, payload);
  }
}

export default GraphicalPassword;