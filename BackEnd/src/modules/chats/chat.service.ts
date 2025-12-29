import { log } from 'node:console';
import { Chat } from '../../models/Chat.js';
import { SubjectFolder } from '../../models/Folder.js';
import { AppError } from '../../utils/AppError.js';



/**
 * Create a new chat under a folder
 */
export async function createChat(
    userId: string,
    folderId: string,
    title: string,
    studyMode?: "simple" | "step" | "interview"
) {
    console.log("[SERVICE] createChat called", {
        userId,
        folderId
    });

    // Ensure folder exists and belongs to the user
    const folder = await SubjectFolder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false
    });

    if (!folder) {
        console.error("[SERVICE] Folder not found or unauthorized", {
            folderId,
            userId
        });
        throw new AppError("Folder not found", 404);
    }

    const chat = await Chat.create({
        folderId,
        title,
        studyMode
    });

    console.log("[SERVICE] Chat document created", {
        chatId: chat._id
    });

    return chat;
}

/**
 * Get all non-archived chats for a folder
 */
export async function getChats(
    userId: string,
    folderId: string
) {
    console.log("[SERVICE] getChats called", {
        userId,
        folderId
    });

    // Ensure folder exists and belongs to the user
    const folder = await SubjectFolder.findOne({
        _id: folderId,
        ownerId: userId,
        isDeleted: false
    });

    if (!folder) {
        console.error("[SERVICE] Folder not found or unauthorized", {
            folderId,
            userId
        });
        throw new AppError("Folder not found", 404);
    }

    const chats = await Chat.find({
        folderId,
        isArchived: false
    }).sort({ updatedAt: -1 });

    console.log("[SERVICE] Chats fetched", {
        count: chats.length
    });

    return chats;
}

/**
 * Archive a chat (soft delete)
 */
export async function archiveChat(
    userId: string,
    chatId: string
) {
    console.log("[SERVICE] archiveChat called", {
        userId,
        chatId
    });

    const chat = await Chat.findOneAndUpdate(
        { _id: chatId },
        { isArchived: true },
        { new: true }
    );

    if (!chat) {
        console.error("[SERVICE] Chat not found", {
            chatId
        });
        throw new AppError("Chat not Found", 404);
    }

    return chat;
}


export async function getAllchatsForUser(userId: string){
    // get user's all non archived chats
    const folders = await SubjectFolder.find({
        ownerId: userId,
        isDeleted : false
    }).select('_id');

    const folderIds = folders.map(f => f._id);

    return await Chat.find({
        folderId: { $in: folderIds },
        isArchived: false
    }).sort({ updatedAt: -1 });
}