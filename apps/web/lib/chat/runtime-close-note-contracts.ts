import type {
  RoleCoreMemoryCloseNoteArchive,
  RoleCoreMemoryCloseNoteArtifact,
  RoleCoreMemoryCloseNoteHandoffPacket,
  RoleCoreMemoryCloseNoteOutput,
  RoleCoreMemoryCloseNotePersistenceEnvelope,
  RoleCoreMemoryCloseNotePersistenceManifest,
  RoleCoreMemoryCloseNotePersistencePayload,
  RoleCoreMemoryCloseNoteRecord
} from "@/lib/chat/role-core";

export type RuntimeCloseNoteArtifacts = {
  roleCoreCloseNoteHandoffPacket?: RoleCoreMemoryCloseNoteHandoffPacket | null;
  roleCoreCloseNoteArtifact?: RoleCoreMemoryCloseNoteArtifact | null;
  roleCoreCloseNoteRecord?: RoleCoreMemoryCloseNoteRecord | null;
  roleCoreCloseNoteArchive?: RoleCoreMemoryCloseNoteArchive | null;
  roleCoreCloseNotePersistenceEnvelope?: RoleCoreMemoryCloseNotePersistenceEnvelope | null;
  roleCoreCloseNotePersistenceManifest?: RoleCoreMemoryCloseNotePersistenceManifest | null;
  roleCoreCloseNotePersistencePayload?: RoleCoreMemoryCloseNotePersistencePayload | null;
  roleCoreCloseNoteOutput?: RoleCoreMemoryCloseNoteOutput | null;
};
