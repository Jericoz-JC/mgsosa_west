import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ParticipantRoom } from "@/lib/game/types";
import { ParticipantRoomCard } from "./participant-room-card";

const room: ParticipantRoom = {
  id: "room-imposter",
  name: "Imposter · Pacific",
  game: "imposter",
  status: "open",
  rotationGroups: ["A", "C"],
};

describe("ParticipantRoomCard", () => {
  it("normalizes a pasted numeric code and joins the room", async () => {
    const onJoin = vi.fn().mockResolvedValue(undefined);
    render(<ParticipantRoomCard currentRoom={null} onJoin={onJoin} phase="rotation-one" />);

    fireEvent.change(screen.getByLabelText("Room code"), { target: { value: "48 215" } });
    expect(screen.getByLabelText("Room code")).toHaveValue("48215");
    fireEvent.click(screen.getByRole("button", { name: /join room/i }));

    await waitFor(() => expect(onJoin).toHaveBeenCalledWith("48215"));
  });

  it("shows a clear retry message for an inactive code", async () => {
    const onJoin = vi.fn().mockRejectedValue(new Error("Room code not found or no longer open."));
    render(<ParticipantRoomCard currentRoom={null} onJoin={onJoin} phase="rotation-two" />);

    fireEvent.change(screen.getByLabelText("Room code"), { target: { value: "73106" } });
    fireEvent.click(screen.getByRole("button", { name: /join room/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That code is not active");
  });

  it("shows room-specific instructions and lets a participant switch", () => {
    render(<ParticipantRoomCard currentRoom={room} onJoin={vi.fn()} phase="rotation-one" />);

    expect(screen.getByText("Find the Imposter")).toBeInTheDocument();
    expect(screen.getByText(/Watch Zoom private chat/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enter a different code" }));
    expect(screen.getByRole("heading", { name: "Switch breakout rooms" })).toBeInTheDocument();
    expect(screen.getByLabelText("Room code")).toBeInTheDocument();
  });
});
