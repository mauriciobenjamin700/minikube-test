import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UserState = {
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
};

const initialState: UserState = {
    user: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        login(state, action: PayloadAction<{ id: number; name: string; email: string }>) {
            state.user = action.payload;
        },
        logout(state) {
            state.user = null;
        },
    },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;