import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import SettingsTypes "../types/settings";
import SettingsLib "../lib/settings";

mixin (
  accessControlState : AccessControl.AccessControlState,
  credentials : Map.Map<Principal, Map.Map<Text, SettingsTypes.Credential>>,
) {
  // Stores a new exchange/API credential for the caller.
  public shared ({ caller }) func addCredential(cred : SettingsTypes.Credential) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.addCredential(caller, cred, credentials);
  };

  // Returns the caller's stored credentials (secrets never included).
  public query ({ caller }) func listCredentials() : async [SettingsTypes.CredentialView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.listCredentials(caller, credentials);
  };

  // Returns a single credential view for the caller.
  public query ({ caller }) func getCredential(id : Text) : async ?SettingsTypes.CredentialView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.getCredential(caller, id, credentials);
  };

  // Updates an existing credential for the caller.
  public shared ({ caller }) func updateCredential(cred : SettingsTypes.Credential) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.updateCredential(caller, cred, credentials);
  };

  // Removes a credential for the caller.
  public shared ({ caller }) func removeCredential(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.removeCredential(caller, id, credentials);
  };

  // Checks the connection status of a stored credential for the caller.
  public query ({ caller }) func checkConnection(id : Text) : async SettingsTypes.CredentialStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.checkConnection(caller, id, credentials);
  };
};
