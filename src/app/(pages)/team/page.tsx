// src/app/(pages)/team/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Card,
  Avatar,
  Row,
  Col,
  Tag,
  Button,
  Spin,
  Alert,
} from "antd";
import {
  UserOutlined,
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { getTeams, Team } from "@/services/teamService";

const { Title, Paragraph } = Typography;
const { Meta } = Card;

export default function TeamPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const result = await getTeams({ limit: 50 }); // Load all teams
      setTeams(result.data);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลทีม");
      console.error("Error loading teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (teamId: string) => {
    router.push(`/team/${teamId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="กำลังโหลดข้อมูลทีม..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Alert
            message="เกิดข้อผิดพลาด"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={loadTeams}>
                ลองอีกครั้ง
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Title level={1} className="mb-4">
            <UserOutlined className="mr-2" />
            ทีมงานของเรา
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
            พบกับทีมงานมืออาชีพที่มีความเชี่ยวชาญในสาขาต่างๆ
            พร้อมที่จะสร้างสรรค์โปรเจคที่ยอดเยี่ยมให้กับคุณ
          </Paragraph>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <UserOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
            <Title level={3} style={{ color: "#999", marginTop: 16 }}>
              ยังไม่มีข้อมูลทีมงาน
            </Title>
            <Paragraph style={{ color: "#666" }}>
              กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูลทีมงาน
            </Paragraph>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {teams.map((member) => (
              <Col xs={24} sm={12} lg={6} key={member.id}>
                <Card
                  className="h-full shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  cover={
                    <div className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
                      <Avatar
                        size={80}
                        src={member.avatar_url}
                        icon={<UserOutlined />}
                        className="mb-4"
                      />
                    </div>
                  }
                  actions={[
                    <Button
                      key="view"
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(member.id!)}
                      className="text-blue-600 hover:text-blue-800"
                    ></Button>,
                    member.github_url && (
                      <Button
                        key="github"
                        type="text"
                        icon={<GithubOutlined />}
                        href={member.github_url}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ),
                    member.linkedin_url && (
                      <Button
                        key="linkedin"
                        type="text"
                        icon={<LinkedinOutlined />}
                        href={member.linkedin_url}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ),
                    member.email && (
                      <Button
                        key="email"
                        type="text"
                        icon={<MailOutlined />}
                        href={`mailto:${member.email}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ),
                  ].filter(Boolean)}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => handleViewDetail(member.id!)}
                  >
                    <Meta
                      title={
                        <span className="text-lg font-semibold hover:text-blue-600 transition-colors">
                          {member.name}
                        </span>
                      }
                      description={
                        <div>
                          <Tag color="blue" className="mb-2">
                            {member.position}
                          </Tag>
                          {member.description && (
                            <Paragraph
                              className="text-sm text-gray-600 mb-3"
                              ellipsis={{ rows: 2 }}
                            >
                              {member.description}
                            </Paragraph>
                          )}
                          {member.skills && member.skills.length > 0 && (
                            <div>
                              <Paragraph className="text-xs font-semibold mb-1">
                                ทักษะ:
                              </Paragraph>
                              <div className="flex flex-wrap gap-1">
                                {member.skills
                                  .slice(0, 3)
                                  .map((skill, index) => (
                                    <Tag key={index} color="geekblue">
                                      {skill}
                                    </Tag>
                                  ))}
                                {member.skills.length > 3 && (
                                  <Tag color="default">
                                    +{member.skills.length - 3}
                                  </Tag>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <div className="text-center mt-12">
          <Title level={3} className="mb-4">
            สนใจร่วมงานกับเรา?
          </Title>
          <Paragraph className="text-gray-600 mb-6">
            เรากำลังมองหาคนเก่งมาร่วมทีม หากคุณมีความสามารถและมีแรงบันดาลใจ
          </Paragraph>
          <Button type="primary" size="large" icon={<MailOutlined />}>
            ติดต่อเรา
          </Button>
        </div>
      </div>
    </div>
  );
}
