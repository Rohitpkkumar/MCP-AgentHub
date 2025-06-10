use ic_cdk::storage;
use ic_cdk_macros::*;
use std::collections::HashMap;

type EvidenceDB = HashMap<String, (String, String, u64)>; // case_no -> (user_id, file_hash, timestamp)

#[init]
fn init() {
    if storage::stable_restore::<(EvidenceDB,)>().is_err() {
        let empty_db: EvidenceDB = HashMap::new();
        storage::stable_save((&empty_db,)).unwrap();
    }
}

#[update]
fn upload_evidence(case_no: String, id: String, hash: String, timestamp: u64) -> String {
    let mut db: EvidenceDB = storage::stable_restore::<(EvidenceDB,)>()
        .unwrap_or_else(|_| (HashMap::new(),))
        .0;

    if db.contains_key(&case_no) {
        return "Error: Case number already exists".to_string();
    }

    db.insert(case_no, (id, hash, timestamp));
    storage::stable_save((&db,)).unwrap();

    "Evidence uploaded".to_string()
}

#[query]
fn verify_evidence(case_no: String, hash: String) -> String {
    let db: EvidenceDB = storage::stable_restore::<(EvidenceDB,)>()
        .unwrap_or_else(|_| (HashMap::new(),))
        .0;

    match db.get(&case_no) {
        Some((id, stored_hash, timestamp)) if stored_hash == &hash => {
            format!("✅ Verified.\nUploaded by: {}\nAt: {}", id, timestamp)
        }
        Some(_) => "❌ Error: File hash does not match".to_string(),
        None => "❌ Error: Case not found".to_string(),
    }
}

#[query]
fn get_all_evidence() -> Vec<(String, String, String, u64)> {
    let db: EvidenceDB = storage::stable_restore::<(EvidenceDB,)>()
        .unwrap_or_else(|_| (HashMap::new(),))
        .0;

    db.into_iter()
        .map(|(case_no, (user, hash, timestamp))| (case_no, user, hash, timestamp))
        .collect()
}
