module {
  // Connection status of a stored exchange/API credential.
  public type CredentialStatus = {
    #connected;
    #disconnected;
    #error : Text; // human-readable reason when the connection check failed
  };

  // A single exchange/API credential stored privately for one user.
  public type Credential = {
    id : Text; // unique credential id within the owner's set
    exchange : Text; // exchange/provider name, e.g. "binance"
    apiKey : Text; // the stored API key
    apiSecret : Text; // the stored API secret
    status : CredentialStatus; // last known connection status
    createdAt : Int; // nanoseconds since epoch
  };

  // Public view of a credential — never includes the secret.
  public type CredentialView = {
    id : Text;
    exchange : Text;
    apiKey : Text; // masked or full key, never the secret
    status : CredentialStatus;
    createdAt : Int;
  };
};
