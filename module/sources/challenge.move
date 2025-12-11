module fit_social::challenge {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};
    use fit_social::escrow;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 0;
    const E_CHALLENGE_INACTIVE: u64 = 1;
    const E_CHALLENGE_EXPIRED: u64 = 2;
    const E_CHALLENGE_NOT_ENDED: u64 = 3;
    const E_ALREADY_JOINED: u64 = 4;
    const E_NOT_PARTICIPANT: u64 = 5;
    const E_ALREADY_SUBMITTED: u64 = 6;
    const E_NO_SUBMISSION: u64 = 7;
    const E_ALREADY_VOTED: u64 = 8;
    const E_REWARDS_ALREADY_DISTRIBUTED: u64 = 9;

    /// Challenge struct
    struct Challenge has key, store {
        id: u64,
        creator: address,
        name: vector<u8>,
        description: vector<u8>,
        entry_fee: u64,        // USDC amount in smallest unit
        start_time: u64,
        end_time: u64,
        participants: vector<address>,
        submissions: Table<address, Submission>,
        total_pool: u64,
        is_active: bool,
        rewards_distributed: bool,
    }

    struct Submission has store {
        proof_uri: vector<u8>,  // IPFS hash
        timestamp: u64,
        votes_for: u64,
        votes_against: u64,
        voters: vector<address>,  // Track who voted to prevent double voting
        is_verified: bool,
    }

    /// Global challenge registry
    struct ChallengeRegistry has key {
        challenges: Table<u64, Challenge>,
        next_id: u64,
    }

    /// Initialize registry
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(account_addr == @fit_social, E_NOT_AUTHORIZED);
        move_to(account, ChallengeRegistry {
            challenges: table::new(),
            next_id: 0,
        });
    }

    /// Create challenge
    public entry fun create_challenge(
        creator: &signer,
        name: vector<u8>,
        description: vector<u8>,
        entry_fee: u64,
        duration_days: u64,
    ) acquires ChallengeRegistry {
        let creator_addr = signer::address_of(creator);
        let registry = borrow_global_mut<ChallengeRegistry>(@fit_social);
        
        let challenge_id = registry.next_id;
        let now = timestamp::now_seconds();
        
        let challenge = Challenge {
            id: challenge_id,
            creator: creator_addr,
            name,
            description,
            entry_fee,
            start_time: now,
            end_time: now + (duration_days * 86400),
            participants: vector::empty(),
            submissions: table::new(),
            total_pool: 0,
            is_active: true,
            rewards_distributed: false,
        };
        
        table::add(&mut registry.challenges, challenge_id, challenge);
        registry.next_id = challenge_id + 1;
    }

    /// Join challenge with payment
    /// Payment is deposited into escrow contract
    public entry fun join_challenge(
        participant: &signer,
        challenge_id: u64,
    ) acquires ChallengeRegistry {
        let participant_addr = signer::address_of(participant);
        let registry = borrow_global_mut<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow_mut(&mut registry.challenges, challenge_id);
        
        // Validations
        assert!(challenge.is_active, E_CHALLENGE_INACTIVE);
        assert!(timestamp::now_seconds() < challenge.end_time, E_CHALLENGE_EXPIRED);
        assert!(!vector::contains(&challenge.participants, &participant_addr), E_ALREADY_JOINED);
        
        // Deposit entry fee into escrow
        escrow::deposit(participant, challenge_id, challenge.entry_fee);
        
        // Add participant
        vector::push_back(&mut challenge.participants, participant_addr);
        challenge.total_pool = challenge.total_pool + challenge.entry_fee;
    }

    /// Submit proof of completion
    public entry fun submit_proof(
        participant: &signer,
        challenge_id: u64,
        proof_uri: vector<u8>,
    ) acquires ChallengeRegistry {
        let participant_addr = signer::address_of(participant);
        let registry = borrow_global_mut<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow_mut(&mut registry.challenges, challenge_id);
        
        // Validations
        assert!(vector::contains(&challenge.participants, &participant_addr), E_NOT_PARTICIPANT);
        assert!(!table::contains(&challenge.submissions, participant_addr), E_ALREADY_SUBMITTED);
        
        let submission = Submission {
            proof_uri,
            timestamp: timestamp::now_seconds(),
            votes_for: 0,
            votes_against: 0,
            voters: vector::empty(),
            is_verified: false,
        };
        
        table::add(&mut challenge.submissions, participant_addr, submission);
    }

    /// Vote on submission (with double-vote prevention)
    public entry fun vote(
        voter: &signer,
        challenge_id: u64,
        participant: address,
        approve: bool,
    ) acquires ChallengeRegistry {
        let voter_addr = signer::address_of(voter);
        let registry = borrow_global_mut<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow_mut(&mut registry.challenges, challenge_id);
        
        assert!(table::contains(&challenge.submissions, participant), E_NO_SUBMISSION);
        
        let submission = table::borrow_mut(&mut challenge.submissions, participant);
        
        // Prevent double voting
        assert!(!vector::contains(&submission.voters, &voter_addr), E_ALREADY_VOTED);
        vector::push_back(&mut submission.voters, voter_addr);
        
        if (approve) {
            submission.votes_for = submission.votes_for + 1;
        } else {
            submission.votes_against = submission.votes_against + 1;
        };
        
        // Auto-verify if votes_for > votes_against by threshold of 3
        if (submission.votes_for > submission.votes_against + 3) {
            submission.is_verified = true;
        };
    }

    /// Distribute rewards to verified winners
    /// Can only be called after challenge ends
    public entry fun distribute_rewards(
        challenge_id: u64,
    ) acquires ChallengeRegistry {
        let registry = borrow_global_mut<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow_mut(&mut registry.challenges, challenge_id);
        
        // Validations
        assert!(timestamp::now_seconds() > challenge.end_time, E_CHALLENGE_NOT_ENDED);
        assert!(!challenge.rewards_distributed, E_REWARDS_ALREADY_DISTRIBUTED);
        
        // Collect verified winners
        let winners = vector::empty<address>();
        let i = 0;
        let participant_count = vector::length(&challenge.participants);
        
        while (i < participant_count) {
            let participant_addr = *vector::borrow(&challenge.participants, i);
            
            if (table::contains(&challenge.submissions, participant_addr)) {
                let submission = table::borrow(&challenge.submissions, participant_addr);
                if (submission.is_verified) {
                    vector::push_back(&mut winners, participant_addr);
                };
            };
            
            i = i + 1;
        };
        
        // Distribute via escrow
        escrow::distribute_rewards(challenge_id, winners, challenge.total_pool);
        
        challenge.rewards_distributed = true;
        challenge.is_active = false;
    }

    /// Cancel challenge and refund all participants
    /// Can only be called by creator before challenge ends
    public entry fun cancel_challenge(
        creator: &signer,
        challenge_id: u64,
    ) acquires ChallengeRegistry {
        let creator_addr = signer::address_of(creator);
        let registry = borrow_global_mut<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow_mut(&mut registry.challenges, challenge_id);
        
        // Only creator can cancel
        assert!(challenge.creator == creator_addr, E_NOT_AUTHORIZED);
        assert!(challenge.is_active, E_CHALLENGE_INACTIVE);
        assert!(!challenge.rewards_distributed, E_REWARDS_ALREADY_DISTRIBUTED);
        
        // Refund all participants
        escrow::refund_challenge(
            challenge_id, 
            challenge.participants, 
            challenge.entry_fee
        );
        
        challenge.is_active = false;
    }

    // ========== View Functions ==========

    #[view]
    public fun get_challenge_details(
        challenge_id: u64
    ): (address, vector<u8>, vector<u8>, u64, u64, u64, u64, bool) acquires ChallengeRegistry {
        let registry = borrow_global<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow(&registry.challenges, challenge_id);
        (
            challenge.creator,
            challenge.name,
            challenge.description,
            challenge.entry_fee,
            challenge.start_time,
            challenge.end_time,
            challenge.total_pool,
            challenge.is_active
        )
    }

    #[view]
    public fun get_participant_count(challenge_id: u64): u64 acquires ChallengeRegistry {
        let registry = borrow_global<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow(&registry.challenges, challenge_id);
        vector::length(&challenge.participants)
    }

    #[view]
    public fun is_participant(challenge_id: u64, addr: address): bool acquires ChallengeRegistry {
        let registry = borrow_global<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow(&registry.challenges, challenge_id);
        vector::contains(&challenge.participants, &addr)
    }

    #[view]
    public fun has_submitted(challenge_id: u64, addr: address): bool acquires ChallengeRegistry {
        let registry = borrow_global<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow(&registry.challenges, challenge_id);
        table::contains(&challenge.submissions, addr)
    }

    #[view]
    public fun get_submission_votes(
        challenge_id: u64,
        participant: address
    ): (u64, u64, bool) acquires ChallengeRegistry {
        let registry = borrow_global<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow(&registry.challenges, challenge_id);
        let submission = table::borrow(&challenge.submissions, participant);
        (submission.votes_for, submission.votes_against, submission.is_verified)
    }

    // ========== Test Helpers ==========

    #[test_only]
    public fun get_challenge_info(
        challenge_id: u64
    ): (address, vector<u8>, u64, u64, u64, bool) acquires ChallengeRegistry {
        let registry = borrow_global<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow(&registry.challenges, challenge_id);
        (
            challenge.creator,
            challenge.name,
            challenge.entry_fee,
            challenge.total_pool,
            vector::length(&challenge.participants),
            challenge.is_active
        )
    }

    #[test_only]
    public fun get_submission_info(
        challenge_id: u64,
        participant: address
    ): (u64, u64, bool) acquires ChallengeRegistry {
        let registry = borrow_global<ChallengeRegistry>(@fit_social);
        let challenge = table::borrow(&registry.challenges, challenge_id);
        let submission = table::borrow(&challenge.submissions, participant);
        (submission.votes_for, submission.votes_against, submission.is_verified)
    }

    #[test_only]
    public fun get_next_id(): u64 acquires ChallengeRegistry {
        let registry = borrow_global<ChallengeRegistry>(@fit_social);
        registry.next_id
    }

    // ========== Tests ==========

    #[test_only]
    use aptos_framework::account;

    #[test_only]
    fun setup_test_env(aptos_framework: &signer, admin: &signer) {
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Initialize both modules
        initialize(admin);
        escrow::initialize_for_test(admin);
        
        // Setup coin infrastructure
        account::create_account_for_test(signer::address_of(admin));
    }

    #[test(aptos_framework = @0x1, admin = @fit_social, creator = @0x3)]
    fun test_create_challenge(aptos_framework: &signer, admin: &signer, creator: &signer) acquires ChallengeRegistry {
        setup_test_env(aptos_framework, admin);
        
        let name = b"30 Day Fitness Challenge";
        let description = b"Complete 30 days of workouts";
        let entry_fee = 1000000;
        let duration_days = 30;
        
        create_challenge(creator, name, description, entry_fee, duration_days);
        
        let (creator_addr, challenge_name, fee, pool, participant_count, is_active) = get_challenge_info(0);
        assert!(creator_addr == signer::address_of(creator), 101);
        assert!(challenge_name == name, 102);
        assert!(fee == entry_fee, 103);
        assert!(pool == 0, 104);
        assert!(participant_count == 0, 105);
        assert!(is_active == true, 106);
    }

    // Additional tests would follow the same pattern...
}