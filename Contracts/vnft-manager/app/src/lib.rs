#![no_std]
use gstd::msg;
use sails_rs::prelude::*;

pub mod services;
pub mod states;
pub mod clients;
use services::vnft_manager_service::VNFTManagerService;
use services::ticket_service::TicketService;
use clients::extended_vnft_client::Vnft as VnftClient;

#[derive(Default)]
pub struct VnftManagerProgram;

impl VnftManagerProgram {
    pub fn init_state(admin: ActorId) {
        VNFTManagerService::<VnftClient<()>>::seed(admin);
    }

    pub fn init_state_with_vnft_id(admin: ActorId, vnft_contract_id: ActorId) {
        VNFTManagerService::<VnftClient<()>>::seed_with_contract_id(admin, vnft_contract_id);
    }

    pub fn init_ticket_state(admin: ActorId) {
        TicketService::<VnftClient<()>>::seed(admin);
    }

    pub fn init_ticket_state_with_vnft(admin: ActorId, vnft_contract_id: ActorId) {
        TicketService::<VnftClient<()>>::seed_with_vnft(admin, vnft_contract_id);
    }
}

#[program]
impl VnftManagerProgram {
    pub fn new() -> Self {
        Self::init_state(msg::source());
        Self
    }

    pub fn new_with_vnft_contract_id(vnft_contract_id: ActorId) -> Self {
        Self::init_state_with_vnft_id(
            msg::source(), 
            vnft_contract_id
        );

        Self
    }

    pub fn vnft_manager_svc(&self) -> VNFTManagerService<VnftClient<()>> {
        let vnft_client = VnftClient::new(());
        VNFTManagerService::new(vnft_client)
    }

    pub fn ticket_svc(&self) -> TicketService<VnftClient<()>> {
        let vnft_client = VnftClient::new(());
        TicketService::new(vnft_client)
    }
}