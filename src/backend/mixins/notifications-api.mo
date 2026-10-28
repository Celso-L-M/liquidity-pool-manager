import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import EmailClient "mo:caffeineai-email/emailClient";
import Types "../types/common";
import NotificationTypes "../types/notifications";

mixin (
  notifications : Map.Map<Types.UserId, List.List<NotificationTypes.Notification>>,
  alertPrefs : Map.Map<Types.UserId, NotificationTypes.AlertPreferences>,
) {
  // Guards a public endpoint to signed-in callers only.
  func requireUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please sign in");
    };
  };

  // Default alert preferences for a user who has not configured any yet.
  func defaultPreferences() : NotificationTypes.AlertPreferences {
    {
      liquidityRemoved = true;
      liquidityWithdrawn = true;
      impermanentLossRisk = true;
      emailDelivery = false;
    }
  };

  // Human-readable email subject for a notification kind.
  func subject(kind : NotificationTypes.NotificationType) : Text {
    switch (kind) {
      case (#liquidityRemoved) "Liquidity removed from your pool";
      case (#liquidityWithdrawn) "Liquidity withdrawn from your pool";
      case (#impermanentLossRisk) "Impermanent loss risk detected";
    };
  };

  // Returns the caller's notification history (read/unread).
  public query ({ caller }) func listNotifications() : async [NotificationTypes.Notification] {
    requireUser(caller);
    let userNotifications = notifications.get(caller) ?? List.empty<NotificationTypes.Notification>();
    userNotifications.toArray()
  };

  // Marks a single notification as read for the caller.
  public shared ({ caller }) func markRead(id : Nat) : async () {
    requireUser(caller);
    switch (notifications.get(caller)) {
      case (?list) {
        list.mapInPlace(func n = if (n.id == id) { { n with read = true } } else { n });
      };
      case null {};
    };
  };

  // Marks all of the caller's notifications as read.
  public shared ({ caller }) func markAllRead() : async () {
    requireUser(caller);
    switch (notifications.get(caller)) {
      case (?list) {
        list.mapInPlace(func n = { n with read = true });
      };
      case null {};
    };
  };

  // Returns the caller's alert preferences.
  public query ({ caller }) func getPreferences() : async NotificationTypes.AlertPreferences {
    requireUser(caller);
    alertPrefs.get(caller) ?? defaultPreferences()
  };

  // Updates the caller's alert-type and email-delivery preferences.
  public shared ({ caller }) func updatePreferences(prefs : NotificationTypes.AlertPreferences) : async () {
    requireUser(caller);
    alertPrefs.add(caller, prefs);
  };

  // Creates a notification for the caller and delivers it in-app and, when
  // email delivery is enabled, to the caller's verified email address.
  public shared ({ caller }) func createNotification(kind : NotificationTypes.NotificationType, poolId : Types.PoolId, email : Text) : async () {
    requireUser(caller);
    let prefs = alertPrefs.get(caller) ?? defaultPreferences();
    let enabled = switch (kind) {
      case (#liquidityRemoved) prefs.liquidityRemoved;
      case (#liquidityWithdrawn) prefs.liquidityWithdrawn;
      case (#impermanentLossRisk) prefs.impermanentLossRisk;
    };
    if (enabled) {
      let userNotifications = notifications.get(caller) ?? List.empty<NotificationTypes.Notification>();
      let notification : NotificationTypes.Notification = {
        id = userNotifications.size();
        kind;
        poolId;
        at = Time.now();
        read = false;
      };
      userNotifications.add(notification);
      notifications.add(caller, userNotifications);
      if (prefs.emailDelivery) {
        ignore (
          await EmailClient.sendServiceEmail(
            "no-reply",
            [email],
            subject(kind),
            "A liquidity event was detected for pool " # poolId # ".",
          )
        );
      };
    };
  };
};
