export type CommunityAuthor = {
  display_name: string;
  country: string;
  intended_major: string;
  intake: string;
  status_badge: string;
};

export type CommunityComment = {
  id: number;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
  author: CommunityAuthor;
  can_edit: boolean;
  can_moderate: boolean;
};

export type CommunityPost = {
  id: number;
  group_slug: string;
  group_title: string;
  post_type: "question" | "experience" | "guide" | "accepted_profile" | "deadline_update";
  title: string;
  body: string;
  status: "active" | "hidden" | "locked";
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author: CommunityAuthor;
  comment_count: number;
  comments: CommunityComment[];
  is_saved: boolean;
  can_edit: boolean;
  can_moderate: boolean;
};

export type CommunityGroupSummary = {
  slug: string;
  title: string;
  description: string;
  group_type: "country" | "university" | "intake" | "topic";
  member_count: number;
  post_count: number;
  is_member: boolean;
  audience: string;
};

export type CommunityGroupDetail = CommunityGroupSummary & {
  rules: string[];
  resources: string[];
  can_post: boolean;
};

export type CommunityHomePayload = {
  recommendations: {
    country: CommunityGroupSummary[];
    universities: CommunityGroupSummary[];
    intake: CommunityGroupSummary[];
    topics: CommunityGroupSummary[];
  };
  questions_from_path: CommunityPost[];
  accepted_insights: CommunityPost[];
  saved_posts: CommunityPost[];
};

export type CommunityContributor = {
  profile: CommunityAuthor;
  role: "member" | "moderator" | "staff";
  posts_count: number;
};

export type CommunityGroupPayload = {
  group: CommunityGroupDetail;
  pinned_posts: CommunityPost[];
  related_groups: CommunityGroupSummary[];
  top_contributors: CommunityContributor[];
};
