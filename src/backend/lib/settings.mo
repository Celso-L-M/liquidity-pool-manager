import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Types "../types/settings";

module {
  // Public view of a credential — never includes the secret.
  public func toView(credential : Types.Credential) : Types.CredentialView {
    {
      id = credential.id;
      exchange = credential.exchange;
      apiKey = credential.apiKey;
      status = credential.status;
      createdAt = credential.createdAt;
    };
  };

  // Lists all credentials stored for the given owner.
  public func listCredentials(
    owner : Principal,
    credentials : Map.Map<Principal, Map.Map<Text, Types.Credential>>,
  ) : [Types.CredentialView] {
    switch (credentials.get(owner)) {
      case (?userCreds) {
        userCreds.entries().map(func (_, c) = toView(c)).toArray();
      };
      case null { [] };
    };
  };

  // Returns a single credential view for the given owner and id.
  public func getCredential(
    owner : Principal,
    id : Text,
    credentials : Map.Map<Principal, Map.Map<Text, Types.Credential>>,
  ) : ?Types.CredentialView {
    switch (credentials.get(owner)) {
      case (?userCreds) {
        switch (userCreds.get(id)) {
          case (?c) { ?toView(c) };
          case null { null };
        };
      };
      case null { null };
    };
  };

  // Stores a new credential for the given owner.
  public func addCredential(
    owner : Principal,
    credential : Types.Credential,
    credentials : Map.Map<Principal, Map.Map<Text, Types.Credential>>,
  ) : () {
    switch (credentials.get(owner)) {
      case (?userCreds) {
        userCreds.add(credential.id, credential);
      };
      case null {
        let userCreds = Map.empty<Text, Types.Credential>();
        userCreds.add(credential.id, credential);
        credentials.add(owner, userCreds);
      };
    };
  };

  // Updates an existing credential for the given owner.
  public func updateCredential(
    owner : Principal,
    credential : Types.Credential,
    credentials : Map.Map<Principal, Map.Map<Text, Types.Credential>>,
  ) : () {
    switch (credentials.get(owner)) {
      case (?userCreds) {
        userCreds.add(credential.id, credential);
      };
      case null {};
    };
  };

  // Removes a credential for the given owner.
  public func removeCredential(
    owner : Principal,
    id : Text,
    credentials : Map.Map<Principal, Map.Map<Text, Types.Credential>>,
  ) : () {
    switch (credentials.get(owner)) {
      case (?userCreds) {
        userCreds.remove(id);
      };
      case null {};
    };
  };

  // Checks the connection status of a stored credential for the given owner.
  public func checkConnection(
    owner : Principal,
    id : Text,
    credentials : Map.Map<Principal, Map.Map<Text, Types.Credential>>,
  ) : Types.CredentialStatus {
    switch (credentials.get(owner)) {
      case (?userCreds) {
        switch (userCreds.get(id)) {
          case (?c) {
            if (c.apiKey != "" and c.apiSecret != "") { #connected } else { #disconnected };
          };
          case null { #disconnected };
        };
      };
      case null { #disconnected };
    };
  };
};
