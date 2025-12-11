module fit_social::escrow {
    use std::signer;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;

    /// Capability to control the resource account
    struct EscrowCapability has key {
        signer_cap: SignerCapability,
    }

    /// Escrow account that holds all challenge funds
    struct EscrowAccount has key {
        /// Maps challenge_id -> total escrowed amount
        balances: Table<u64, u64>,
        /// Total platform fees collected
        platform_fees: u64,
        /// Admin address that can withdraw platform fees
        admin: address,
    }

    /// Initialize the escrow system with a resource account
    /// This creates a new account that will hold all funds
    public entry fun initialize(account: &signer, metadata_serialized: vector<u8>, code: vector<u8>) {
        let account_addr = signer::address_of(account);
        assert!(account_addr == @fit_social, E_NOT_AUTHORIZED);
        
        // Create resource account for holding funds
        let (resource_signer, signer_cap) = account::create_resource_account(account, b"fit_social_escrow");
        
        // Register AptosCoin for the resource account
        coin::register<AptosCoin>(&resource_signer);
        
        // Store the signer capability
        move_to(account, EscrowCapability {
            signer_cap,
        });
        
        move_to(account, EscrowAccount {
            balances: table::new(),
            platform_fees: 0,
            admin: account_addr,
        });
    }

    /// Deposit funds into escrow for a specific challenge
    public fun deposit(
        payer: &signer,
        challenge_id: u64,
        amount: u64,
    ) acquires EscrowAccount, EscrowCapability {
        assert!(amount > 0, E_INVALID_AMOUNT);
        
        let escrow = borrow_global_mut<EscrowAccount>(@fit_social);
        let escrow_cap = borrow_global<EscrowCapability>(@fit_social);
        
        // Get resource account address
        let resource_addr = account::get_signer_capability_address(&escrow_cap.signer_cap);
        
        // Transfer coins from payer to resource account
        let payment = coin::withdraw<AptosCoin>(payer, amount);
        coin::deposit(resource_addr, payment);
        
        // Update balance for this challenge
        if (table::contains(&escrow.balances, challenge_id)) {
            let current = table::borrow_mut(&mut escrow.balances, challenge_id);
            *current = *current + amount;
        } else {
            table::add(&mut escrow.balances, challenge_id, amount);
        };
    }

    /// Distribute rewards to winners after challenge ends
    public fun distribute_rewards(
        challenge_id: u64,
        winners: vector<address>,
        total_pool: u64,
    ) acquires EscrowAccount, EscrowCapability {
        let escrow = borrow_global_mut<EscrowAccount>(@fit_social);
        let escrow_cap = borrow_global<EscrowCapability>(@fit_social);
        
        // Verify escrow has sufficient balance
        assert!(table::contains(&escrow.balances, challenge_id), E_NOT_INITIALIZED);
        let escrowed = table::borrow(&escrow.balances, challenge_id);
        assert!(*escrowed >= total_pool, E_INSUFFICIENT_BALANCE);
        
        // Calculate platform fee (5%)
        let platform_fee = (total_pool * 5) / 100;
        let prize_pool = total_pool - platform_fee;
        
        // Add to platform fees
        escrow.platform_fees = escrow.platform_fees + platform_fee;
        
        // Distribute to winners
        let winner_count = vector::length(&winners);
        if (winner_count > 0) {
            let payout_per_winner = prize_pool / winner_count;
            
            // Get resource account signer
            let resource_signer = account::create_signer_with_capability(&escrow_cap.signer_cap);
            
            let i = 0;
            while (i < winner_count) {
                let winner = *vector::borrow(&winners, i);
                // Transfer coins to winner from resource account
                let payment = coin::withdraw<AptosCoin>(&resource_signer, payout_per_winner);
                coin::deposit(winner, payment);
                i = i + 1;
            };
        };
        
        // Clear challenge balance
        let balance_ref = table::borrow_mut(&mut escrow.balances, challenge_id);
        *balance_ref = 0;
    }

    /// Refund participants if challenge is cancelled
    public fun refund_challenge(
        challenge_id: u64,
        participants: vector<address>,
        entry_fee: u64,
    ) acquires EscrowAccount, EscrowCapability {
        let escrow = borrow_global_mut<EscrowAccount>(@fit_social);
        let escrow_cap = borrow_global<EscrowCapability>(@fit_social);
        
        // Get resource account signer
        let resource_signer = account::create_signer_with_capability(&escrow_cap.signer_cap);
        
        let participant_count = vector::length(&participants);
        let i = 0;
        while (i < participant_count) {
            let participant = *vector::borrow(&participants, i);
            // Refund entry fee to each participant
            let refund = coin::withdraw<AptosCoin>(&resource_signer, entry_fee);
            coin::deposit(participant, refund);
            i = i + 1;
        };
        
        // Clear challenge balance
        if (table::contains(&escrow.balances, challenge_id)) {
            let balance_ref = table::borrow_mut(&mut escrow.balances, challenge_id);
            *balance_ref = 0;
        };
    }

    /// Admin withdraws accumulated platform fees
    public entry fun withdraw_platform_fees(
        admin: &signer,
        amount: u64,
    ) acquires EscrowAccount, EscrowCapability {
        let admin_addr = signer::address_of(admin);
        let escrow = borrow_global_mut<EscrowAccount>(@fit_social);
        let escrow_cap = borrow_global<EscrowCapability>(@fit_social);
        
        assert!(admin_addr == escrow.admin, E_NOT_AUTHORIZED);
        assert!(escrow.platform_fees >= amount, E_INSUFFICIENT_BALANCE);
        
        escrow.platform_fees = escrow.platform_fees - amount;
        
        // Get resource account signer
        let resource_signer = account::create_signer_with_capability(&escrow_cap.signer_cap);
        
        // Transfer to admin
        let payment = coin::withdraw<AptosCoin>(&resource_signer, amount);
        coin::deposit(admin_addr, payment);
    }

    // ========== View Functions ==========

    #[view]
    public fun get_challenge_balance(challenge_id: u64): u64 acquires EscrowAccount {
        let escrow = borrow_global<EscrowAccount>(@fit_social);
        if (table::contains(&escrow.balances, challenge_id)) {
            *table::borrow(&escrow.balances, challenge_id)
        } else {
            0
        }
    }

    #[view]
    public fun get_platform_fees(): u64 acquires EscrowAccount {
        let escrow = borrow_global<EscrowAccount>(@fit_social);
        escrow.platform_fees
    }

    #[view]
    public fun get_resource_account_address(): address acquires EscrowCapability {
        let escrow_cap = borrow_global<EscrowCapability>(@fit_social);
        account::get_signer_capability_address(&escrow_cap.signer_cap)
    }

    // ========== Test Helpers ==========

    #[test_only]
    public fun initialize_for_test(account: &signer) {
        // For testing, we can skip resource account creation
        move_to(account, EscrowAccount {
            balances: table::new(),
            platform_fees: 0,
            admin: signer::address_of(account),
        });
    }
}