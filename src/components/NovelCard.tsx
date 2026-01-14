import { Card, CardActionArea, CardMedia, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export interface Novel {
    id: number;
    name: string;
    cover: string;
    url: string; // or path
    pluginId: string;
    inLibrary: boolean;
    chaptersUnread?: number;
    chaptersDownloaded?: number;
}

interface NovelCardProps {
    novel: Novel;
}

export default function NovelCard({ novel }: NovelCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        // Navigate based on whether it's in library (has ID) or from source
        if (novel.id) {
            navigate(`/novel/${novel.id}`);
        } else {
            navigate(`/novel/source/${novel.pluginId}/${encodeURIComponent(novel.url)}`);
        }
    };

    const getCoverUrl = (cover: string) => {
        if (!cover) return '';
        if (cover.startsWith('http')) return `/api/image-proxy?url=${encodeURIComponent(cover)}`;
        if (cover.startsWith('file://')) {
            return cover.replace(/.*[\/\\]data[\/\\]files[\/\\]/, '/api/files/').replace(/\\/g, '/');
        }
        return cover;
    };



    return (
        <Card sx={{ maxWidth: 345, position: 'relative' }}>
            <CardActionArea onClick={handleClick}>
                <Box sx={{ position: 'relative', pt: '150%' }}>
                    <CardMedia
                        component="img"
                        image={getCoverUrl(novel.cover)}
                        alt={novel.name}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    {!!novel.chaptersUnread && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 5,
                                right: 5,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                borderRadius: 1,
                                px: 0.5,
                                typography: 'caption',
                                fontWeight: 'bold',
                                zIndex: 1,
                            }}
                        >
                            {novel.chaptersUnread}
                        </Box>
                    )}
                    {!!novel.chaptersDownloaded && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 5,
                                left: 5,
                                bgcolor: 'secondary.main',
                                color: 'secondary.contrastText',
                                borderRadius: 1,
                                px: 0.5,
                                typography: 'caption',
                                fontWeight: 'bold',
                                zIndex: 1,
                            }}
                        >
                            DL
                        </Box>
                    )}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                            color: 'white',
                            p: 1,
                            pt: 4,
                        }}
                    >
                        <Typography variant="subtitle2" sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.2,
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}>
                            {novel.name}
                        </Typography>
                    </Box>
                </Box>
            </CardActionArea>
        </Card>
    );
}
