import type { CredentialStatus } from "@/backend";
import type { CredentialView } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAddCredential,
  useListCredentials,
  useRemoveCredential,
  useUpdateCredential,
} from "@/hooks/useQueries";
import type { Credential } from "@/types";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function statusMeta(status: CredentialStatus): {
  label: string;
  icon: typeof CheckCircle2;
  className: string;
} {
  switch (status.__kind__) {
    case "connected":
      return {
        label: "Connected",
        icon: CheckCircle2,
        className: "bg-success/10 text-success",
      };
    case "disconnected":
      return {
        label: "Disconnected",
        icon: WifiOff,
        className: "bg-muted text-muted-foreground",
      };
    case "error":
      return {
        label: "Error",
        icon: XCircle,
        className: "bg-destructive/10 text-destructive",
      };
    default:
      return {
        label: "Disconnected",
        icon: WifiOff,
        className: "bg-muted text-muted-foreground",
      };
  }
}

interface CredentialFormState {
  exchange: string;
  apiKey: string;
  apiSecret: string;
}

const EMPTY_FORM: CredentialFormState = {
  exchange: "",
  apiKey: "",
  apiSecret: "",
};

export default function Settings() {
  const { data: credentials = [], isLoading } = useListCredentials();
  const addCredential = useAddCredential();
  const updateCredential = useUpdateCredential();
  const removeCredential = useRemoveCredential();

  const [form, setForm] = useState<CredentialFormState>(EMPTY_FORM);
  const [showSecret, setShowSecret] = useState(false);
  const [editing, setEditing] = useState<CredentialView | null>(null);
  const [editForm, setEditForm] = useState<CredentialFormState>(EMPTY_FORM);
  const [removing, setRemoving] = useState<CredentialView | null>(null);

  const canSubmit =
    form.exchange.trim() !== "" &&
    form.apiKey.trim() !== "" &&
    form.apiSecret.trim() !== "";

  function handleAdd() {
    const cred: Credential = {
      id: crypto.randomUUID(),
      exchange: form.exchange.trim(),
      apiKey: form.apiKey.trim(),
      apiSecret: form.apiSecret.trim(),
      status: { __kind__: "disconnected", disconnected: null },
      createdAt: BigInt(Date.now()) * 1_000_000n,
    };
    addCredential.mutate(cred, {
      onSuccess: () => {
        setForm(EMPTY_FORM);
        setShowSecret(false);
        toast.success("Credential added");
      },
      onError: () => toast.error("Failed to add credential"),
    });
  }

  function openEdit(cred: CredentialView) {
    setEditing(cred);
    setEditForm({
      exchange: cred.exchange,
      apiKey: cred.apiKey,
      apiSecret: "",
    });
  }

  function handleUpdate() {
    if (!editing) return;
    const updated: Credential = {
      ...editing,
      exchange: editForm.exchange.trim(),
      apiKey: editForm.apiKey.trim(),
      apiSecret: editForm.apiSecret.trim(),
    };
    updateCredential.mutate(updated, {
      onSuccess: () => {
        setEditing(null);
        toast.success("Credential updated");
      },
      onError: () => toast.error("Failed to update credential"),
    });
  }

  function handleRemove() {
    if (!removing) return;
    removeCredential.mutate(removing.id, {
      onSuccess: () => {
        setRemoving(null);
        toast.success("Credential removed");
      },
      onError: () => toast.error("Failed to remove credential"),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your exchange credentials and connection status.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Add credential
            </CardTitle>
            <CardDescription>
              Store API credentials for a DEX/exchange. Credentials are kept
              private to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="exchange">Exchange</Label>
              <Input
                id="exchange"
                data-ocid="settings.exchange_input"
                placeholder="e.g. Uniswap"
                value={form.exchange}
                onChange={(e) => setForm({ ...form, exchange: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">API key</Label>
              <Input
                id="apiKey"
                data-ocid="settings.api_key_input"
                placeholder="Paste your API key"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiSecret">API secret</Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  data-ocid="settings.api_secret_input"
                  type={showSecret ? "text" : "password"}
                  placeholder="Paste your API secret"
                  value={form.apiSecret}
                  onChange={(e) =>
                    setForm({ ...form, apiSecret: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  data-ocid="settings.toggle_secret_button"
                  aria-label={
                    showSecret ? "Hide API secret" : "Show API secret"
                  }
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showSecret ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              data-ocid="settings.add_button"
              onClick={handleAdd}
              disabled={!canSubmit || addCredential.isPending}
              className="mt-1"
            >
              {addCredential.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              {addCredential.isPending ? "Adding..." : "Add credential"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Stored credentials
            </CardTitle>
            <CardDescription>
              {credentials.length} credential
              {credentials.length === 1 ? "" : "s"} on file
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={`skeleton-${i}`}
                    data-ocid={`settings.loading_state.${i}`}
                    className="h-16 animate-pulse rounded-lg bg-muted/60"
                  />
                ))}
              </div>
            ) : credentials.length === 0 ? (
              <div
                data-ocid="settings.empty_state"
                className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <KeyRound className="size-6" />
                </div>
                <p className="font-display text-base font-semibold">
                  No credentials yet
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add your first exchange credential to start connecting your
                  DEX accounts.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {credentials.map((cred, i) => {
                  const meta = statusMeta(cred.status);
                  const StatusIcon = meta.icon;
                  return (
                    <li
                      key={cred.id}
                      data-ocid={`settings.item.${i}`}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card/60 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                          {cred.exchange.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-semibold">
                            {cred.exchange}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {cred.apiKey}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`gap-1.5 ${meta.className}`}
                        >
                          <StatusIcon className="size-3" />
                          {meta.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`settings.edit_button.${i}`}
                          aria-label={`Edit ${cred.exchange} credential`}
                          onClick={() => openEdit(cred)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`settings.delete_button.${i}`}
                          aria-label={`Remove ${cred.exchange} credential`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRemoving(cred)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent data-ocid="settings.edit_modal">
          <DialogHeader>
            <DialogTitle className="font-display">Edit credential</DialogTitle>
            <DialogDescription>
              Update the details for {editing?.exchange}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="editExchange">Exchange</Label>
              <Input
                id="editExchange"
                data-ocid="settings.edit_exchange_input"
                value={editForm.exchange}
                onChange={(e) =>
                  setEditForm({ ...editForm, exchange: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editApiKey">API key</Label>
              <Input
                id="editApiKey"
                data-ocid="settings.edit_api_key_input"
                value={editForm.apiKey}
                onChange={(e) =>
                  setEditForm({ ...editForm, apiKey: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editApiSecret">API secret</Label>
              <Input
                id="editApiSecret"
                data-ocid="settings.edit_api_secret_input"
                type="password"
                value={editForm.apiSecret}
                onChange={(e) =>
                  setEditForm({ ...editForm, apiSecret: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="settings.cancel_button"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="settings.save_button"
              onClick={handleUpdate}
              disabled={
                updateCredential.isPending ||
                editForm.exchange.trim() === "" ||
                editForm.apiKey.trim() === "" ||
                editForm.apiSecret.trim() === ""
              }
            >
              {updateCredential.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {updateCredential.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <DialogContent data-ocid="settings.delete_modal">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove credential
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the {removing?.exchange}{" "}
              credential? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="settings.cancel_button"
              onClick={() => setRemoving(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="settings.confirm_delete_button"
              onClick={handleRemove}
              disabled={removeCredential.isPending}
            >
              {removeCredential.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              {removeCredential.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
