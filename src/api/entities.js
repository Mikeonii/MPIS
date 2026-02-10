// Re-export from offline-aware entities
// This is the ONLY change needed -- all pages importing from here get offline support automatically
// sample change
export {
  Account,
  Assistance,
  FamilyMember,
  Pharmacy,
  SourceOfFunds,
  User,
} from "@/lib/offline/offlineEntities";
