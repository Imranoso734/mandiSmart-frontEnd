
export type Form = {
    email: string
    password: string
}
export interface IForgetForm {
    email: string
}
export type ResetPassword = {
    token: string
    password: string
    confirmPassword: string
}

export interface User {
    id: number
    name: string
    email: string
    role: "ADMIN" | "SITE_MANAGER"
    profilePicture?: string
    password?: string
    confirmPassword?: string
    isActive?: boolean
}

type Password = {
    password_txt: string;
};

type SiteManager = {
    id: number;
    email: string;
    name: string;
    role: "SITE_MANAGER";
    password: Password;
};

type Member = {
    id: number;
    email: string;
    siteId: number;
    userType: "ADMIN" | "CLIENT";
};
export interface Site {
    id: number;
    name: string;
    address: string;
    phone: string;
    mobile: string;
    postal_code: string;
    status: "ACTIVE" | "INACTIVE";
    siteManagerId: number;
    createdAt: string;
    updatedAt: string;
    siteManager: SiteManager;
    members: Member[];
};
export interface Bin {
    id: number;
    serialNumber: string;
    siteId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
type Worker = {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
    subContractorId: number;
    createdAt: string;
}
export interface Subcontractor {
    id: number;
    companyName: string;
    contactName: string;
    contactPhone: string;
    siteId: number;
    createdAt: string;
    updatedAt: string;
    workers?: Worker[];
}
export interface BookingAsset {
    asset: {
        s3Key: string;
    };
}

export interface BookingBin {
    id: number;
    serialNumber: string;
}

export interface BookingItem {
    id: number;
    bookingId: number;
    binId: number;
    startDate: string;
    expectedEndDate: string;
    assignedAt: string;
    returnedAt: string | null;
    createdAt: string;
    bin: BookingBin;
}

export interface BookedBy {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "SITE_MANAGER" | "LOGISTICS_MANAGER";
}

export interface BookingSite {
    id: number;
    name: string;
}

export interface BookingSubcontractor {
    id: number;
    companyName: string;
}

export interface Booking {
    id: number;
    bookingRef: string;
    status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    siteId: number;
    subcontractorId: number;
    startDate: string;
    expectedEndDate: string;
    bookedById: number;
    createdAt: string;
    updatedAt: string;

    bookingAssets: BookingAsset[];

    site: BookingSite;

    subcontractor: BookingSubcontractor;

    bookedBy: BookedBy;

    items: BookingItem[];
}