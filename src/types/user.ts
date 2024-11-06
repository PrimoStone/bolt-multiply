export interface UserStatistics {
    correctAnswers: number;
    totalAnswers: number;
    lastLoginDate?: string;
}

export interface UserData {
    username: string;
    password: string;
    statistics: UserStatistics;
} 