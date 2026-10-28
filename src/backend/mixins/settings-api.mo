import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/settings";
import SettingsLib "../lib/settings";

mixin (
  accessControlState : AccessControl.AccessControlState,
  credentials : Map.Map<Principal, Map.Map<Text, Types.Credential>>,
) {
  // Lists all credentials for the signed-in caller.
  public query ({ caller }) func listCredentials() : async [Types.CredentialView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.listCredentials(caller, credentials);
  };

  // Returns a single credential view for the signed-in caller.
  public query ({ caller }) func getCredential(id : Text) : async ?Types.CredentialView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.getCredential(caller, id, credentials);
  };

  // Stores a new credential for the signed-in caller.
  public shared ({ caller }) func addCredential(credential : Types.Credential) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.addCredential(caller, credential, credentials);
  };

  // Updates an existing credential for the signed-in caller.
  public shared ({ caller }) func updateCredential(credential : Types.Credential) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.updateCredential(caller, credential, credentials);
  };

  // Removes a credential for the signed-in caller.
  public shared ({ caller }) func removeCredential(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.removeCredential(caller, id, credentials);
  };

  // Checks the connection status of a stored credential for the signed-in caller.
  public shared ({ caller }) func checkConnection(id : Text) : async Types.CredentialStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    SettingsLib.checkConnection(caller, id, credentials);
  };
};
