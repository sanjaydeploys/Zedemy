const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });

class Post {
    static async createPost({ postId, title, content, author, category, date, slug, titleImage, titleVideo, summary, subtitles, superTitles }) {
        console.log("🔹 Creating Post - Received Data:", { postId, title, content, author, category, date, slug, titleImage, titleVideo, summary, subtitles, superTitles });

        const params = {
            TableName: 'Posts',
            Item: {
                postId: { S: postId },
                title: { S: title },
                content: { S: content },
                author: { S: author },
                category: { S: category },
                date: { S: date },
                slug: { S: slug },
                ...(titleImage ? { titleImage: { S: titleImage } } : {}),
                ...(titleVideo ? { titleVideo: { S: titleVideo } } : {}),
                ...(summary ? { summary: { S: summary } } : {}),
                ...(Array.isArray(subtitles) && subtitles.length > 0 ? {
                    subtitles: {
                        L: subtitles.map(sub => ({
                            M: {
                                title: { S: sub.title || "Untitled" },
                                bulletPoints: {
                                    L: Array.isArray(sub.bulletPoints) ? sub.bulletPoints.map(bp => ({ S: bp.text || "" })) : []
                                }
                            }
                        }))
                    }
                } : {}),
                ...(Array.isArray(superTitles) && superTitles.length > 0 ? {
                    superTitles: {
                        L: superTitles.map(st => ({
                            M: {
                                superTitle: { S: st.superTitle || "" },
                                attributes: {
                                    L: Array.isArray(st.attributes) ? st.attributes.map(attr => ({
                                        M: {
                                            attribute: { S: attr.attribute || "" },
                                            items: {
                                                L: Array.isArray(attr.items) ? attr.items.map(i => ({
                                                    M: { title: { S: i.title || "" } }
                                                })) : []
                                            }
                                        }
                                    })) : []
                                }
                            }
                        }))
                    }
                } : {})
            },
            ConditionExpression: "attribute_not_exists(postId)"
        };

        console.log("🔹 DynamoDB PutItem Params:", JSON.stringify(params, null, 2));

        try {
            await dbClient.send(new PutItemCommand(params));
            console.log("✅ Post Successfully Stored in DynamoDB");
        } catch (error) {
            console.error("❌ Error Storing Post in DynamoDB:", error);
        }

        return { postId, title, content, author, category, date, slug, titleImage, titleVideo, summary, subtitles, superTitles };
    }

    static fromDynamoDB(item) {
        return {
            postId: item.postId?.S || '',
            title: item.title?.S || '',
            content: item.content?.S || '',
            author: item.author?.S || '',
            category: item.category?.S || '',
            date: item.date?.S || '',
            slug: item.slug?.S || '',
            titleImage: item.titleImage?.S || '',
            titleVideo: item.titleVideo?.S || '',
            summary: item.summary?.S || '',
            subtitles: item.subtitles?.L?.map(sub => ({
                title: sub.M?.title?.S || '',
                bulletPoints: sub.M?.bulletPoints?.L?.map(bp => bp.S) || []
            })) || [],
            superTitles: item.superTitles?.L?.map(st => ({
                superTitle: st.M?.superTitle?.S || '',
                attributes: st.M?.attributes?.L?.map(attr => ({
                    attribute: attr.M?.attribute?.S || '',
                    items: attr.M?.items?.L?.map(i => ({ title: i.M?.title?.S || '' })) || []
                })) || []
            })) || []
        };
    }
}

module.exports = Post;
