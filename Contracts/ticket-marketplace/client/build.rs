fn main() {
    sails_idl_gen::generate_idl_to_file::<ticket_marketplace_app::MarketplaceProgram>(
        std::path::Path::new("src").join("marketplace_client.rs"),
    );
    sails_client_gen::generate_client();
}

