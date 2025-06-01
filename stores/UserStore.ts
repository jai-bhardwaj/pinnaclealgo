import { makeAutoObservable } from 'mobx';
import type { RouterOutputs } from '@/lib/trpc/client';

type User = RouterOutputs['user']['getById'];
type UserProfile = RouterOutputs['user']['getProfile'];
type UserStats = RouterOutputs['user']['getStats'];

export class UserStore {
    // Base store functionality
    isLoading = false;
    isSubmitting = false;
    error: string | null = null;

    // Current user data
    currentUser: User | null = null;
    currentUserProfile: UserProfile | null = null;
    currentUserStats: UserStats | null = null;

    // Users list for admin
    users: User[] = [];
    usersTotal = 0;
    usersPage = 1;
    usersLimit = 10;

    // Search and filters
    searchQuery = '';
    filters = {
        role: undefined as string | undefined,
        status: undefined as string | undefined,
    };

    constructor() {
        makeAutoObservable(this);
    }

    // Base store methods
    setLoading(loading: boolean) {
        this.isLoading = loading;
    }

    setSubmitting(submitting: boolean) {
        this.isSubmitting = submitting;
    }

    setError(error: string | null) {
        this.error = error;
    }

    clearError() {
        this.error = null;
    }

    // Data setters (to be called from React components using tRPC hooks)
    setCurrentUser(user: User | null) {
        this.currentUser = user;
    }

    setCurrentUserProfile(profile: UserProfile | null) {
        this.currentUserProfile = profile;
    }

    setCurrentUserStats(stats: UserStats | null) {
        this.currentUserStats = stats;
    }

    setUsers(users: User[], total: number) {
        this.users = users;
        this.usersTotal = total;
    }

    // User management actions
    addUser(user: User) {
        this.users.unshift(user);
        this.usersTotal += 1;
    }

    updateUserInList(updatedUser: User) {
        const index = this.users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
            this.users[index] = updatedUser;
        }

        // Update current user if it's the same one
        if (this.currentUser?.id === updatedUser.id) {
            this.currentUser = updatedUser;
        }
    }

    removeUser(userId: string) {
        this.users = this.users.filter(user => user.id !== userId);
        this.usersTotal = Math.max(0, this.usersTotal - 1);

        // Clear current user if it was deleted
        if (this.currentUser?.id === userId) {
            this.currentUser = null;
            this.currentUserProfile = null;
            this.currentUserStats = null;
        }
    }

    removeUsers(userIds: string[]) {
        this.users = this.users.filter(user => !userIds.includes(user.id));
        this.usersTotal = Math.max(0, this.usersTotal - userIds.length);

        // Clear current user if it was deleted
        if (this.currentUser && userIds.includes(this.currentUser.id)) {
            this.currentUser = null;
            this.currentUserProfile = null;
            this.currentUserStats = null;
        }
    }

    // Filters and pagination
    setFilters(filters: Partial<typeof this.filters>) {
        this.filters = { ...this.filters, ...filters };
        this.usersPage = 1; // Reset to first page
    }

    clearFilters() {
        this.filters = {
            role: undefined,
            status: undefined,
        };
        this.searchQuery = '';
        this.usersPage = 1;
    }

    setSearchQuery(query: string) {
        this.searchQuery = query;
        this.usersPage = 1; // Reset to first page
    }

    setPage(page: number) {
        this.usersPage = page;
    }

    setLimit(limit: number) {
        this.usersLimit = limit;
        this.usersPage = 1; // Reset to first page
    }

    nextPage() {
        if (this.hasNextPage) {
            this.usersPage += 1;
        }
    }

    previousPage() {
        if (this.hasPreviousPage) {
            this.usersPage -= 1;
        }
    }

    // Computed properties
    get hasNextPage() {
        return this.usersPage * this.usersLimit < this.usersTotal;
    }

    get hasPreviousPage() {
        return this.usersPage > 1;
    }

    get totalPages() {
        return Math.ceil(this.usersTotal / this.usersLimit);
    }

    get currentFilters() {
        return {
            ...this.filters,
            page: this.usersPage,
            limit: this.usersLimit,
        };
    }

    get hasActiveFilters() {
        return Object.values(this.filters).some(value => value !== undefined) || this.searchQuery.trim() !== '';
    }

    get activeUsers() {
        return this.users.filter(user => user.status === 'ACTIVE');
    }

    get inactiveUsers() {
        return this.users.filter(user => user.status === 'INACTIVE');
    }

    get suspendedUsers() {
        return this.users.filter(user => user.status === 'SUSPENDED');
    }

    // Logout
    logout() {
        this.currentUser = null;
        this.currentUserProfile = null;
        this.currentUserStats = null;
        this.users = [];
        this.clearFilters();
        this.clearError();
    }

    // Clear data
    clear() {
        this.currentUser = null;
        this.currentUserProfile = null;
        this.currentUserStats = null;
        this.users = [];
        this.usersTotal = 0;
        this.clearFilters();
        this.clearError();
    }
} 