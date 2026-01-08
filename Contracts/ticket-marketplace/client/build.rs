use sails_client_gen::ClientGenerator;
use std::{env, path::PathBuf};

fn main() {
    let out_dir_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    let idl_file_path = out_dir_path.join("marketplace.idl");
    sails_idl_gen::generate_idl_to_file::<ticket_marketplace_app::MarketplaceProgram>(
        std::path::Path::new("src").join("marketplace_client.rs"),
    );
        // Generate client code from IDL file
    ClientGenerator::from_idl_path(&idl_file_path)
        .with_mocks("mocks")
        .generate_to(PathBuf::from(env::var("OUT_DIR").unwrap()).join("marketplace_client.rs"))
        .unwrap();
}


// fn main() {
//     let out_dir_path = PathBuf::from(env::var("OUT_DIR").unwrap());
//     let idl_file_path = out_dir_path.join("concert.idl");

//     // Generate IDL file for the program
//     sails_idl_gen::generate_idl_to_file::<concert_app::ConcertProgram>(&idl_file_path).unwrap();

//     // Generate client code from IDL file
//     ClientGenerator::from_idl_path(&idl_file_path)
//         .with_mocks("mocks")
//         .generate_to(PathBuf::from(env::var("OUT_DIR").unwrap()).join("concert_client.rs"))
//         .unwrap();
// }
