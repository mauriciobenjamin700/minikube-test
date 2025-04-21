import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/redux/userSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
    },
});

// Tipos para o estado e o dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;