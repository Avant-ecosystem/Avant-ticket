use sails_rs::prelude::*;

// Struct to handle the state of the contract
#[derive(Default)]
pub struct VNFTManagerState {
    // Vec to store admins that can do special actions
    pub admins: Vec<ActorId>,
    // contract id from the extended vft contract
    pub vnft_contract_id: Option<ActorId>,
}

impl VNFTManagerState {
    // Related function "new", returns a new VNFTManagerState instance with a new admin address
    // Is necessary to pass an address to be the first admin to perform the actions (commands) in
    // the contract
    pub fn new(admin: ActorId) -> Self {
        let mut temp = Self::default();
        temp.admins.push(admin);
        temp
    }

    // Related function "new_with_contract_id",  returns a new VNFTManagerState instance with a 
    // new admin address and a contract id from extended_vnft contract.
    // Is necessary to pass an address to be the first admin to perform the actions (commands) in
    // the contract, and the extended_vnft contract id
    pub fn new_with_contract_id(admin: ActorId, vnft_contract_id: ActorId) -> Self {
        let mut temp = Self::default();
        temp.admins.push(admin);
        temp.vnft_contract_id = Some(vnft_contract_id);
        temp
    }

    // Helper function that returns if an address is an admin
    pub fn is_admin(&self, address: &ActorId) -> bool {
        self.admins.contains(address)
    }
}