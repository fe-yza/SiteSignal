export interface BackendUser {
  id: string;
  email: string;
  has_seen_intro: boolean;
  dismissed_hints: string[];
}

export interface BackendTokenResponse {
  user: BackendUser;
  access_token: string;
}
